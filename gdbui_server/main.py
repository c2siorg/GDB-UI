from flask import Flask, request, jsonify
from pygdbmi.gdbcontroller import GdbController
from flask_cors import CORS
import subprocess

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Initialize global variables to store the GDB controller and program name
gdb_controller = None
program_name = None

def execute_gdb_command(command):
    response2 = gdb_controller.write(command)
    if response2 is None:
        raise RuntimeError("No response from GDB controller")
    strm = ""
    for rem in response2:
        strm = strm + "\n " + str(rem.get('payload'))
    return strm.strip()

def start_gdb_session(program):
    global gdb_controller, program_name
    program_name = program
    try:
        gdb_controller = GdbController()
    except Exception as e:
        raise RuntimeError(f"Failed to initialize GDB controller: {e}")

    try:
        response = gdb_controller.write(f"-file-exec-and-symbols {program_name}.exe")
        if response is None:
            raise RuntimeError("No response from GDB controller")
    except Exception as e:
        raise RuntimeError(f"Failed to set program file: {e}")

    try:
        response = gdb_controller.write("run")
        if response is None:
            raise RuntimeError("No response from GDB controller")
    except Exception as e:
        raise RuntimeError(f"Failed to start program: {e}")

@app.route('/gdb_command', methods=['POST'])
def gdb_command():
    global program_name
    data = request.get_json()
    command = data.get('command')
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command(command)
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
    global program_name
    data = request.get_json()
    code = data.get('code')
    name = data.get('name')

    with open(f'{name}.cpp', 'w') as file:
        file.write(code)

    result = subprocess.run(['g++', f'{name}.cpp', '-o', f'{name}.exe'], capture_output=True, text=True)

    if result.returncode == 0:
        program_name = None
        return jsonify({'success': True, 'output': 'Compilation successful.'})
    else:
        return jsonify({'success': False, 'output': result.stderr})

@app.route('/set_breakpoint', methods=['POST'])
def set_breakpoint():
    global program_name
    data = request.get_json()
    location = data.get('location')
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command(f"break {location}")
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
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info breakpoints")
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
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("bt")
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
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info threads")
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
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info registers")
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
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info locals")
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
    
    return jsonify(response)

@app.route('/run', methods=['POST'])
def run_program():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("run")
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
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info proc mappings")
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
