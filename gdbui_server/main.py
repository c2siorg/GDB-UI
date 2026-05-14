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


def is_v2_request():
    return request.path.startswith('/v2/')


def success_response(data):
    if is_v2_request():
        return json_response({'success': True, 'data': data})
    return json_response({'success': True, **data})


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


def request_data():
    return request.get_json(silent=True) or {}


def gdb_result_response(file, action):
    global program_name
    try:
        if program_name != file:
            start_gdb_session(f'{file}')
        result = action()
        return success_response({'result': result})
    except Exception as e:
        return error_response('GDB command failed.', code='GDB_COMMAND_FAILED', exc=e)


def v2_route(path):
    return app.route(f'/v2{path}', methods=['POST'])


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

@v2_route('/gdb_command')
@app.route('/gdb_command', methods=['POST'])
def gdb_command():
    data = request_data()
    command = data.get('command')
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command(command))

@v2_route('/compile')
@app.route('/compile', methods=['POST'])
def compile_code():
    global program_name
    data = request_data()
    code = data.get('code')
    name = data.get('name')

    with open(f'{name}.cpp', 'w') as file:
        file.write(code)

    result = subprocess.run(['g++', f'{name}.cpp', '-o', f'output/{name}.exe'], capture_output=True, text=True)

    if result.returncode == 0:
        program_name = None
        return success_response({'output': 'Compilation successful.'})
    else:
        app.logger.warning("Compilation failed for %s: %s", name, result.stderr)
        return error_response(
            'Compilation failed.',
            status_code=400,
            code='COMPILATION_FAILED',
            legacy_field='output',
        )

@v2_route('/upload_file')
@app.route('/upload_file', methods=['POST'])    
def upload_file():
    if 'file' not in request.files or 'name' not in request.form:
        return error_response('No file or name provided', status_code=400, code='INVALID_UPLOAD')

    file = request.files['file']
    name = request.form['name']

    if file.filename == '':
        return error_response('No selected file', status_code=400, code='INVALID_UPLOAD')

    file_path = os.path.join('output/', ensure_exe_extension(name))
    file.save(file_path)

    return success_response({'message': 'File uploaded successfully', 'file_path': file_path})


@v2_route('/set_breakpoint')
@app.route('/set_breakpoint', methods=['POST'])
def set_breakpoint():
    data = request_data()
    location = data.get('location')
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command(f"break {location}"))

@v2_route('/info_breakpoints')
@app.route('/info_breakpoints', methods=['POST'])
def info_breakpoints():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("info breakpoints"))

@v2_route('/stack_trace')
@app.route('/stack_trace', methods=['POST'])
def stack_trace():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("bt"))

@v2_route('/threads')
@app.route('/threads', methods=['POST'])
def threads():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("info threads"))

@v2_route('/get_registers')
@app.route('/get_registers', methods=['POST'])
def get_registers():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("info registers"))

@v2_route('/get_locals')
@app.route('/get_locals', methods=['POST'])
def get_locals():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("info locals"))

@v2_route('/run')
@app.route('/run', methods=['POST'])
def run_program():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("run"))

@v2_route('/memory_map')
@app.route('/memory_map', methods=['POST'])
def memory_map():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("info proc mappings"))

@v2_route('/continue')
@app.route('/continue', methods=['POST'])
def continue_execution():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("continue"))

@v2_route('/step_over')
@app.route('/step_over', methods=['POST'])
def step_over():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("next"))

@v2_route('/step_into')
@app.route('/step_into', methods=['POST'])
def step_into():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("step"))

@v2_route('/step_out')
@app.route('/step_out', methods=['POST'])
def step_out():
    data = request_data()
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command("finish"))

@v2_route('/add_watchpoint')
@app.route('/add_watchpoint', methods=['POST'])
def add_watchpoint():
    data = request_data()
    variable = data.get('variable')
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command(f"watch {variable}"))

@v2_route('/delete_breakpoint')
@app.route('/delete_breakpoint', methods=['POST'])
def delete_breakpoint():
    data = request_data()
    breakpoint_number = data.get('breakpoint_number')
    file = data.get('name')
    return gdb_result_response(file, lambda: execute_gdb_command(f"delete {breakpoint_number}"))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
