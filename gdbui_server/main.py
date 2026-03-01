from flask import Flask, request, jsonify
from flask_cors import CORS
from session_manager import SessionManager, ensure_exe_extension, sanitize_program_name
import subprocess
import os
import atexit
import signal
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

session_manager = SessionManager()
atexit.register(session_manager.shutdown)


def handle_sigterm(signum, frame):
    session_manager.shutdown()
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)

os.makedirs('output', exist_ok=True)


def get_request_data():
    data = request.get_json(silent=True)
    if data is None:
        return None, (jsonify({'success': False, 'error': 'Invalid or missing JSON body'}), 400)
    return data, None


def get_session_id(data):
    session_id = data.get('session_id')
    if not session_id:
        return None, (jsonify({'success': False, 'error': 'session_id is required'}), 400)
    if not session_manager.session_exists(session_id):
        return None, (jsonify({'success': False, 'error': f'Session {session_id} not found'}), 404)
    return session_id, None


@app.route('/create_session', methods=['POST'])
def create_session():
    try:
        session_id = session_manager.create_session()
        return jsonify({'success': True, 'session_id': session_id})
    except RuntimeError as e:
        return jsonify({'success': False, 'error': str(e)}), 503


@app.route('/end_session', methods=['POST'])
def end_session():
    data, err = get_request_data()
    if err:
        return err
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'success': False, 'error': 'session_id is required'}), 400
    session_manager.end_session(session_id)
    return jsonify({'success': True})


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

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, command)
        response = {
            'success': True,
            'result': result,
            'code': f"execute_gdb_command('{command}')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': f"execute_gdb_command('{command}')"
        }

    return jsonify(response)


@app.route('/compile', methods=['POST'])
def compile_code():
    data, err = get_request_data()
    if err:
        return err
    code = data.get('code')
    name = data.get('name')

    if not code or not name:
        return jsonify({'success': False, 'output': 'code and name are required'}), 400

    try:
        safe_name = sanitize_program_name(name)
    except ValueError as e:
        return jsonify({'success': False, 'output': str(e)}), 400

    src_path = os.path.join('output', f'{safe_name}.cpp')
    exe_path = os.path.join('output', f'{safe_name}.exe')

    with open(src_path, 'w') as file:
        file.write(code)

    result = subprocess.run(['g++', src_path, '-o', exe_path], capture_output=True, text=True)

    if result.returncode == 0:
        return jsonify({'success': True, 'output': 'Compilation successful.'})
    else:
        return jsonify({'success': False, 'output': result.stderr})


@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'name' not in request.form:
        return jsonify({'success': False, 'error': 'No file or name provided'}), 400

    file = request.files['file']
    name = request.form['name']

    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400

    try:
        safe_name = sanitize_program_name(name)
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400

    file_path = os.path.join('output', ensure_exe_extension(safe_name))
    file.save(file_path)

    return jsonify({'success': True, 'message': 'File uploaded successfully', 'file_path': file_path})


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

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, f"break {location}")
        response = {
            'success': True,
            'result': result,
            'code': f"execute_gdb_command('break {location}')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': f"execute_gdb_command('break {location}')"
        }

    return jsonify(response)


@app.route('/info_breakpoints', methods=['POST'])
def info_breakpoints():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info breakpoints")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('info breakpoints')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('info breakpoints')"
        }

    return jsonify(response)


@app.route('/stack_trace', methods=['POST'])
def stack_trace():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "bt")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('bt')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('bt')"
        }

    return jsonify(response)


@app.route('/threads', methods=['POST'])
def threads():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info threads")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('info threads')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('info threads')"
        }

    return jsonify(response)


@app.route('/get_registers', methods=['POST'])
def get_registers():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info registers")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('info registers')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('info registers')"
        }

    return jsonify(response)


@app.route('/get_locals', methods=['POST'])
def get_locals():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info functions")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('info functions')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('info functions')"
        }

    return jsonify(response)


@app.route('/run', methods=['POST'])
def run_program():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "run")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('run')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('run')"
        }

    return jsonify(response)


@app.route('/memory_map', methods=['POST'])
def memory_map():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "info proc mappings")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('info proc mappings')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('info proc mappings')"
        }

    return jsonify(response)


@app.route('/continue', methods=['POST'])
def continue_execution():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "continue")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('continue')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('continue')"
        }

    return jsonify(response)


@app.route('/step_over', methods=['POST'])
def step_over():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "next")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('next')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('next')"
        }

    return jsonify(response)


@app.route('/step_into', methods=['POST'])
def step_into():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "step")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('step')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('step')"
        }

    return jsonify(response)


@app.route('/step_out', methods=['POST'])
def step_out():
    data, err = get_request_data()
    if err:
        return err
    session_id, error = get_session_id(data)
    if error:
        return error
    file = data.get('name')

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, "finish")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('finish')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('finish')"
        }

    return jsonify(response)


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

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, f"watch {variable}")
        response = {
            'success': True,
            'result': result,
            'code': f"execute_gdb_command('watch {variable}')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': f"execute_gdb_command('watch {variable}')"
        }

    return jsonify(response)


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

    try:
        session_manager.ensure_program(session_id, file)
        result = session_manager.execute(session_id, f"delete {breakpoint_number}")
        response = {
            'success': True,
            'result': result,
            'code': f"execute_gdb_command('delete {breakpoint_number}')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': f"execute_gdb_command('delete {breakpoint_number}')"
        }

    return jsonify(response)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
