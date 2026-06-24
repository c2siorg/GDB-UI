from flask import Flask, request, jsonify, g
from flask_cors import CORS
from session_manager import SessionManager, ensure_exe_extension, sanitize_program_name
import subprocess
import os
import atexit
import signal
import sys
import logging
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

from flask_socketio import SocketIO, emit, join_room, leave_room

_cors_origins = os.environ.get(
    'GDBUI_CORS_ORIGINS',
    'http://localhost:5173,http://localhost:3000'
).split(',')
socketio = SocketIO(app, async_mode='gevent', cors_allowed_origins=[o.strip() for o in _cors_origins])

session_manager = SessionManager()
atexit.register(session_manager.shutdown)

# Log threading configuration warning
logger.info("=" * 60)
logger.info("GDB-UI Server Starting")
logger.info("Ensure threaded=True (Flask dev) or gunicorn -w 1 --threads=N (prod)")
logger.info("=" * 60)


def handle_sigterm(signum, frame):
    session_manager.shutdown()
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_sigterm)

os.makedirs('output', exist_ok=True)


# ---------------------------------------------------------------------------
# v2 API infrastructure (trace_id, structured responses, required-field validation)
# ---------------------------------------------------------------------------

@app.before_request
def assign_trace_id():
    g.trace_id = str(uuid.uuid4())


def is_v2_request():
    return request.path.startswith('/v2/')


def json_response(payload, status_code=200):
    response = jsonify(payload)
    response.headers['X-Correlation-ID'] = g.trace_id
    return response, status_code


def error_response(message, status_code=500, code='REQUEST_FAILED', exc=None, legacy_field='error'):
    if exc is not None:
        app.logger.error("%s [%s]", message, code, exc_info=True)

    if is_v2_request():
        return json_response({
            'success': False,
            'error': {
                'code': code,
                'message': message,
                'trace_id': g.trace_id,
            }
        }, status_code)

    payload = {
        'success': False,
        legacy_field: message,
        'trace_id': g.trace_id,
    }
    return json_response(payload, status_code)


def success_response(data):
    if is_v2_request():
        return json_response({'success': True, 'data': data})
    return json_response({'success': True, **data})


def request_data():
    return request.get_json(silent=True) or {}


def validate_v2_required_fields(data, required_fields):
    if not is_v2_request():
        return None

    missing_fields = []
    for field in required_fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and value.strip() == ''):
            missing_fields.append(field)

    if not missing_fields:
        return None

    return error_response(
        f"Missing required fields: {', '.join(missing_fields)}.",
        status_code=400,
        code='INVALID_REQUEST',
    )


def v2_route(path):
    return app.route(f'/v2{path}', methods=['POST'])


# ---------------------------------------------------------------------------
# Request helpers (session-aware)
# ---------------------------------------------------------------------------

def get_request_data():
    data = request.get_json(silent=True)
    if data is None:
        return None, error_response('Invalid or missing JSON body', status_code=400, code='INVALID_REQUEST')
    return data, None


def get_session_id(data):
    session_id = data.get('session_id')
    if not session_id:
        return None, error_response('session_id is required', status_code=400, code='INVALID_REQUEST')
    if not session_manager.session_exists(session_id):
        return None, error_response(f'Session {session_id} not found', status_code=404, code='SESSION_NOT_FOUND')
    return session_id, None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/create_session', methods=['POST'])
def create_session():
    try:
        session_id, ws_token = session_manager.create_session()
        return success_response({'session_id': session_id, 'ws_token': ws_token})
    except RuntimeError as e:
        return error_response(str(e), status_code=503, code='MAX_SESSIONS_REACHED')


@app.route('/end_session', methods=['POST'])
def end_session():
    data, err = get_request_data()
    if err:
        return err
    session_id = data.get('session_id')
    if not session_id:
        return error_response('session_id is required', status_code=400, code='INVALID_REQUEST')
    session_manager.end_session(session_id)
    return success_response({})


@v2_route('/gdb_command')
@app.route('/gdb_command', methods=['POST'])
def gdb_command():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    command = data.get('command')
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['command', 'name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, command)
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/compile')
@app.route('/compile', methods=['POST'])
def compile_code():
    data, err = get_request_data()
    if err:
        return err
    code = data.get('code')
    name = data.get('name')
    session_id = data.get('session_id')

    if not session_id:
        return error_response('session_id is required', status_code=400, code='INVALID_REQUEST')

    validation_error = validate_v2_required_fields(data, ['code', 'name'])
    if validation_error:
        return validation_error

    if not code or not name:
        return error_response('code and name are required', status_code=400, code='INVALID_REQUEST')

    try:
        safe_name = sanitize_program_name(name)
    except ValueError as e:
        return error_response(str(e), status_code=400, code='INVALID_PROGRAM_NAME')

    try:
        session_lock = session_manager._get_session_lock(session_id)
    except RuntimeError:
        return error_response(f'Session {session_id} not found', status_code=404, code='SESSION_NOT_FOUND')

    with session_lock:
        # Phase 1: Validation under lock
        session = session_manager._get_session(session_id)
        if not session:
            return error_response('Session not found', status_code=404, code='SESSION_NOT_FOUND')

        # Check if GDB is currently running
        if session.get('controller') is not None:
            return error_response(
                'GDB is currently running a program. Please end the debug session before recompiling.',
                status_code=409,
                code='GDB_ACTIVE'
            )

        # Determine paths
        output_dir = os.path.join('output', session_id)
        os.makedirs(output_dir, exist_ok=True)
        binary_name = safe_name.replace('.cpp', '').replace('.c', '')
        binary_path = os.path.join(output_dir, ensure_exe_extension(binary_name))
        source_path = os.path.join(output_dir, safe_name)

        # Write source file
        with open(source_path, 'w') as f:
            f.write(code)

        session_manager.set_compiling(session_id, True)

    # Phase 2: Compilation OUTSIDE lock (I/O bound, do not block session)
    try:
        try:
            result = subprocess.run(
                ['g++', '-g', '-O0', source_path, '-o', binary_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            compile_output = result.stdout + result.stderr
            compile_success = result.returncode == 0
        except subprocess.TimeoutExpired:
            compile_output = 'Compilation timed out'
            compile_success = False
        except Exception as e:
            compile_output = f'Compilation error: {e}'
            compile_success = False
    finally:
        session_manager.set_compiling(session_id, False)

    # Phase 3: Update state under lock
    with session_lock:
        if compile_success:
            session = session_manager._get_session(session_id)
            if session:
                session['compiled_binary'] = safe_name

    if compile_success:
        return success_response({
            'output': compile_output,
            'binary': binary_name
        })
    else:
        return error_response(compile_output, status_code=400, code='COMPILATION_FAILED', legacy_field='output')


@v2_route('/upload_file')
@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'name' not in request.form:
        return error_response('No file or name provided', status_code=400, code='INVALID_UPLOAD')

    file = request.files['file']
    name = request.form['name']
    session_id = request.form.get('session_id')

    if not session_id:
        return error_response('session_id is required', status_code=400, code='INVALID_REQUEST')

    if file.filename == '':
        return error_response('No selected file', status_code=400, code='INVALID_UPLOAD')

    try:
        safe_name = sanitize_program_name(name)
    except ValueError as e:
        return error_response(str(e), status_code=400, code='INVALID_PROGRAM_NAME')

    try:
        session_lock = session_manager._get_session_lock(session_id)
    except RuntimeError:
        return error_response(f'Session {session_id} not found', status_code=404, code='SESSION_NOT_FOUND')

    with session_lock:
        # Phase 1: Validation under lock
        session = session_manager._get_session(session_id)
        if not session:
            return error_response('Session not found', status_code=404, code='SESSION_NOT_FOUND')

        # Check if GDB is currently running
        if session.get('controller') is not None:
            return error_response(
                'GDB is currently running a program. Please end the debug session before uploading.',
                status_code=409,
                code='GDB_ACTIVE'
            )

        # Determine paths
        output_dir = os.path.join('output', session_id)
        os.makedirs(output_dir, exist_ok=True)
        binary_name = safe_name.replace('.exe', '')
        file_path = os.path.join(output_dir, ensure_exe_extension(safe_name))

    # Phase 2: Save file OUTSIDE lock
    try:
        file.save(file_path)
        upload_success = True
        error_msg = None
    except Exception as e:
        upload_success = False
        error_msg = str(e)

    # Phase 3: Update state under lock
    with session_lock:
        if upload_success:
            session = session_manager._get_session(session_id)
            if session:
                session['compiled_binary'] = safe_name

    if upload_success:
        return success_response({'message': 'File uploaded successfully', 'file_path': file_path})
    else:
        return error_response(f'Failed to save file: {error_msg}', status_code=500, code='UPLOAD_FAILED')


@v2_route('/set_breakpoint')
@app.route('/set_breakpoint', methods=['POST'])
def set_breakpoint():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    location = data.get('location')
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['location', 'name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, f"break {location}")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/info_breakpoints')
@app.route('/info_breakpoints', methods=['POST'])
def info_breakpoints():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info breakpoints")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/stack_trace')
@app.route('/stack_trace', methods=['POST'])
def stack_trace():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "bt")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/threads')
@app.route('/threads', methods=['POST'])
def threads():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info threads")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/get_registers')
@app.route('/get_registers', methods=['POST'])
def get_registers():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info registers")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/get_locals')
@app.route('/get_locals', methods=['POST'])
def get_locals():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info functions")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/run')
@app.route('/run', methods=['POST'])
def run_program():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "run")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/memory_map')
@app.route('/memory_map', methods=['POST'])
def memory_map():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info proc mappings")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/continue')
@app.route('/continue', methods=['POST'])
def continue_execution():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "continue")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/step_over')
@app.route('/step_over', methods=['POST'])
def step_over():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "next")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/step_into')
@app.route('/step_into', methods=['POST'])
def step_into():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "step")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/step_out')
@app.route('/step_out', methods=['POST'])
def step_out():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "finish")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/add_watchpoint')
@app.route('/add_watchpoint', methods=['POST'])
def add_watchpoint():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    variable = data.get('variable')
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['variable', 'name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, f"watch {variable}")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


@v2_route('/delete_breakpoint')
@app.route('/delete_breakpoint', methods=['POST'])
def delete_breakpoint():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    breakpoint_number = data.get('breakpoint_number')
    file = data.get('name')

    validation_error = validate_v2_required_fields(data, ['breakpoint_number', 'name'])
    if validation_error:
        return validation_error

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, f"delete {breakpoint_number}")
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


# ---------------------------------------------------------------------------
# WebSocket namespace: /ws/debug
# ---------------------------------------------------------------------------


@socketio.on('connect', namespace='/ws/debug')
def handle_ws_connect():
    session_id = request.args.get('session_id')
    ws_token = request.args.get('ws_token')

    if not session_id:
        return False

    if not session_manager.validate_ws_token(session_id, ws_token):
        return False

    join_room(session_id)
    emit('connected', {'session_id': session_id})


@socketio.on('disconnect', namespace='/ws/debug')
def handle_ws_disconnect():
    session_id = request.args.get('session_id')
    if session_id:
        leave_room(session_id)


if __name__ == '__main__':
    from gevent import monkey
    monkey.patch_all(subprocess=False, select=False, os=False)
    socketio.run(app, host='0.0.0.0', port=10000)
