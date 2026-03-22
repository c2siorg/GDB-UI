from flask import Flask, request, jsonify
from pygdbmi.gdbcontroller import GdbController
from flask_cors import CORS
from werkzeug.utils import secure_filename
import subprocess
import os

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

OUTPUT_DIR = 'output'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Per-session state: maps X-Session-ID header to session dict
_sessions = {}

def get_session(session_id):
    """Get or create a session dict for the given session ID."""
    if session_id not in _sessions:
        _sessions[session_id] = {'controller': None, 'program': None}
    return _sessions[session_id]

def execute_gdb_command(session, command):
    response2 = session['controller'].write(command)
    if response2 is None:
        raise RuntimeError("No response from GDB controller")
    strm = ""
    for rem in response2:
        strm = strm + "\n " + str(rem.get('payload'))
    return strm.strip()

def ensure_exe_extension(name):
    return name if name.endswith('.exe') else name + '.exe'

def start_gdb_session(session, program):
    session['program'] = program
    try:
        session['controller'] = GdbController()
    except Exception as e:
        raise RuntimeError(f"Failed to initialize GDB controller: {e}")

    try:
        response = session['controller'].write(
            f"-file-exec-and-symbols {os.path.join(OUTPUT_DIR, ensure_exe_extension(program))}"
        )
        if response is None:
            raise RuntimeError("No response from GDB controller")
    except Exception as e:
        raise RuntimeError(f"Failed to set program file: {e}")

    try:
        response = session['controller'].write("run")
        if response is None:
            raise RuntimeError("No response from GDB controller")
    except Exception as e:
        raise RuntimeError(f"Failed to start program: {e}")

@app.route('/gdb_command', methods=['POST'])
def gdb_command():
    data = request.get_json()
    command = data.get('command')
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, command)
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/compile', methods=['POST'])
def compile_code():
    data = request.get_json()
    code = data.get('code')
    raw_name = data.get('name', '')
    name = secure_filename(raw_name)

    if not name or name != raw_name:
        return jsonify({'success': False, 'output': 'Invalid or missing file name.'}), 400

    cpp_path = os.path.join(OUTPUT_DIR, f'{name}.cpp')
    exe_path = os.path.join(OUTPUT_DIR, f'{name}.exe')

    with open(cpp_path, 'w') as f:
        f.write(code)

    result = subprocess.run(
        ['g++', cpp_path, '-o', exe_path],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        # Invalidate all sessions that were using this program
        for session in _sessions.values():
            if session['program'] == name:
                session['program'] = None
        return jsonify({'success': True, 'output': 'Compilation successful.'})
    else:
        return jsonify({'success': False, 'output': result.stderr}), 400

@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'name' not in request.form:
        return jsonify({'success': False, 'error': 'No file or name provided'}), 400

    file = request.files['file']
    name = secure_filename(request.form['name'])

    if not name or file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400

    file_path = os.path.join(OUTPUT_DIR, ensure_exe_extension(name))
    file.save(file_path)

    return jsonify({'success': True, 'message': 'File uploaded successfully', 'file_path': file_path})


@app.route('/set_breakpoint', methods=['POST'])
def set_breakpoint():
    data = request.get_json()
    location = data.get('location')
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, f"break {location}")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/info_breakpoints', methods=['POST'])
def info_breakpoints():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "info breakpoints")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/stack_trace', methods=['POST'])
def stack_trace():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "bt")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/threads', methods=['POST'])
def threads():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "info threads")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/get_registers', methods=['POST'])
def get_registers():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "info registers")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/get_locals', methods=['POST'])
def get_locals():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "info locals")
        response = {
            'success': True,
            'result': result,
            'code': "execute_gdb_command('info locals')"
        }
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'code': "execute_gdb_command('info locals')"
        }
        return jsonify(response), 500

    return jsonify(response)

@app.route('/run', methods=['POST'])
def run_program():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "run")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/memory_map', methods=['POST'])
def memory_map():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "info proc mappings")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/continue', methods=['POST'])
def continue_execution():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "continue")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/step_over', methods=['POST'])
def step_over():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "next")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/step_into', methods=['POST'])
def step_into():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "step")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/step_out', methods=['POST'])
def step_out():
    data = request.get_json()
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, "finish")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/add_watchpoint', methods=['POST'])
def add_watchpoint():
    data = request.get_json()
    variable = data.get('variable')
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, f"watch {variable}")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/delete_breakpoint', methods=['POST'])
def delete_breakpoint():
    data = request.get_json()
    breakpoint_number = data.get('breakpoint_number')
    file = data.get('name')
    session_id = request.headers.get('X-Session-ID', 'default')
    session = get_session(session_id)
    if session['program'] != file:
        start_gdb_session(session, file)

    try:
        result = execute_gdb_command(session, f"delete {breakpoint_number}")
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
        return jsonify(response), 500

    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'active_sessions': len(_sessions)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
