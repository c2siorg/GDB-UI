from flask import Flask, request, jsonify
from flask_cors import CORS
from session_manager import SessionManager, sanitize_program_name
import os, atexit, signal, sys, subprocess, logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

session_manager = SessionManager()

def shutdown_handler(signum=None, frame=None):
    """Graceful cleanup of all session resources on system signal."""
    session_manager.shutdown()
    sys.exit(0)

atexit.register(session_manager.shutdown)
signal.signal(signal.SIGTERM, shutdown_handler)

def handle_gdb_request(command_template):
    """
    Higher-order dispatcher that standardizes GDB command execution
    and ensures just-in-time debugger initialization.
    """
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    program_name = data.get('name')

    if not session_id or not session_manager.session_exists(session_id):
        return jsonify({'success': False, 'error': 'Invalid or expired session'}), 404

    try:
        if program_name:
            session_manager.start_gdb(session_id, program_name)

        cmd = command_template.format(**data) if '{' in command_template else command_template
        result = session_manager.execute(session_id, cmd)
        
        return jsonify({
            'success': True,
            'result': result,
            'code': f"execute_gdb_command('{cmd}')"
        })
    except Exception as e:
        logger.error(f"GDB Execution Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/create_session', methods=['POST'])
def create():
    """Initializes a unique session and its physical sandbox."""
    return jsonify({'success': True, 'session_id': session_manager.create_session()})

@app.route('/end_session', methods=['POST'])
def end():
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    if session_id:
        session_manager.end_session(session_id)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'session_id required'}), 400

@app.route('/compile', methods=['POST'])
def compile_code():
    """Compiles source code within the isolated session sandbox."""
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    code = data.get('code')
    name = data.get('name')

    if not all([session_id, code, name]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    try:
        safe_name = sanitize_program_name(name)
        session_dir = session_manager.get_session_dir(session_id)
        
        src_path = os.path.join(session_dir, f"{safe_name}.cpp")
        exe_path = os.path.join(session_dir, safe_name)

        with open(src_path, 'w') as f:
            f.write(code)

        res = subprocess.run(['g++', src_path, '-o', exe_path], capture_output=True, text=True)
        
        return jsonify({
            'success': res.returncode == 0, 
            'output': 'Compilation successful.' if res.returncode == 0 else res.stderr
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/upload_file', methods=['POST'])
def upload():
    """Uploads a binary directly to the session's physical sandbox."""
    session_id = request.form.get('session_id')
    file = request.files.get('file')
    name = request.form.get('name')
    
    if not all([session_id, file, name]) or not session_manager.session_exists(session_id):
        return jsonify({'success': False, 'error': 'Invalid request parameters'}), 400

    try:
        safe_name = sanitize_program_name(name)
        file_path = os.path.join(session_manager.get_session_dir(session_id), safe_name)
        file.save(file_path)
        return jsonify({'success': True, 'message': 'File isolated in sandbox'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/gdb_command', methods=['POST'])
def gdb_cmd(): return handle_gdb_request("{command}")

@app.route('/set_breakpoint', methods=['POST'])
def set_bp(): return handle_gdb_request("break {location}")

@app.route('/stack_trace', methods=['POST'])
def bt(): return handle_gdb_request("bt")

@app.route('/run', methods=['POST'])
def run(): return handle_gdb_request("run")

@app.route('/continue', methods=['POST'])
def cont(): return handle_gdb_request("continue")

@app.route('/step_over', methods=['POST'])
def next_s(): return handle_gdb_request("next")

@app.route('/step_into', methods=['POST'])
def step(): return handle_gdb_request("step")

@app.route('/step_out', methods=['POST'])
def finish(): return handle_gdb_request("finish")

@app.route('/threads', methods=['POST'])
def threads(): return handle_gdb_request("info threads")

@app.route('/get_registers', methods=['POST'])
def regs(): return handle_gdb_request("info registers")

@app.route('/get_locals', methods=['POST'])
def locals(): return handle_gdb_request("info functions")

@app.route('/memory_map', methods=['POST'])
def mmap(): return handle_gdb_request("info proc mappings")

@app.route('/add_watchpoint', methods=['POST'])
def watch(): return handle_gdb_request("watch {variable}")

@app.route('/delete_breakpoint', methods=['POST'])
def del_bp(): return handle_gdb_request("delete {breakpoint_number}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
    