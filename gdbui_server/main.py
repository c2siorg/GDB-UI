from flask import Flask, request, jsonify, g
from pygdbmi.gdbcontroller import GdbController
from flask_cors import CORS
import subprocess
import os
import uuid

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

gdb_controller = None
program_name = None


@app.before_request
def assign_trace_id():
    g.trace_id = str(uuid.uuid4())


def json_response(payload, status_code=200):
    response = jsonify(payload)
    response.headers['X-Correlation-ID'] = g.trace_id
    return response, status_code


def success_response(data):
    return json_response({'success': True, 'data': data})


def error_response(message, status_code=500):
    return json_response({'success': False, 'error': {'message': str(message), 'trace_id': g.trace_id}}, status_code)

def execute_gdb_command(command):
    response2 = gdb_controller.write(command)
    if response2 is None:
        raise RuntimeError("No response from GDB controller")
    strm = ""
    for rem in response2:
        strm = strm + "\n " + str(rem.get('payload'))
    return strm.strip()

def ensure_exe_extension(name):
    return name if name.endswith('.exe') else name + '.exe'

def start_gdb_session(program):
    global gdb_controller, program_name
    program_name = program
    try:
        gdb_controller = GdbController()
    except Exception as e:
        raise RuntimeError(f"Failed to initialize GDB controller: {e}")

    try:
        response = gdb_controller.write(f"-file-exec-and-symbols {os.path.join('output/', ensure_exe_extension(program_name))}")
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
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/compile', methods=['POST'])
def compile_code():
    global program_name
    data = request.get_json()
    code = data.get('code')
    name = data.get('name')

    with open(f'{name}.cpp', 'w') as file:
        file.write(code)

    result = subprocess.run(['g++', f'{name}.cpp', '-o', f'output/{name}.exe'], capture_output=True, text=True)

    if result.returncode == 0:
        program_name = None
        return success_response({'output': 'Compilation successful.'})
    else:
        return error_response(result.stderr, status_code=400)

@app.route('/upload_file', methods=['POST'])    
def upload_file():
    if 'file' not in request.files or 'name' not in request.form:
        return error_response('No file or name provided', status_code=400)

    file = request.files['file']
    name = request.form['name']

    if file.filename == '':
        return error_response('No selected file', status_code=400)

    file_path = os.path.join('output/', ensure_exe_extension(name))
    file.save(file_path)

    return success_response({'message': 'File uploaded successfully', 'file_path': file_path})


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
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/info_breakpoints', methods=['POST'])
def info_breakpoints():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info breakpoints")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/stack_trace', methods=['POST'])
def stack_trace():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("bt")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/threads', methods=['POST'])
def threads():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info threads")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/get_registers', methods=['POST'])
def get_registers():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info registers")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/get_locals', methods=['POST'])
def get_locals():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info locals")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/run', methods=['POST'])
def run_program():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("run")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/memory_map', methods=['POST'])
def memory_map():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("info proc mappings")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/continue', methods=['POST'])
def continue_execution():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("continue")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/step_over', methods=['POST'])
def step_over():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("next")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/step_into', methods=['POST'])
def step_into():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("step")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/step_out', methods=['POST'])
def step_out():
    global program_name
    data = request.get_json()
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command("finish")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/add_watchpoint', methods=['POST'])
def add_watchpoint():
    global program_name
    data = request.get_json()
    variable = data.get('variable')
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command(f"watch {variable}")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)

@app.route('/delete_breakpoint', methods=['POST'])
def delete_breakpoint():
    global program_name
    data = request.get_json()
    breakpoint_number = data.get('breakpoint_number')
    file = data.get('name')
    if program_name != file:
        start_gdb_session(f'{file}')

    try:
        result = execute_gdb_command(f"delete {breakpoint_number}")
        return success_response({'result': result})
    except Exception as e:
        return error_response(e)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
