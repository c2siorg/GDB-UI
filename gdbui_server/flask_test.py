import unittest
import json
import tempfile
import os
from flask_testing import TestCase
from main import app

class TestGDBRoutes(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        return app

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_program_name = self.ensure_exe_extension(os.path.join(self.temp_dir.name, 'test_program'))

        compile_payload = {
            "code": "#include <iostream>\nint main() { std::cout << 'Hello, World!'; return 0; }",
            "name": self.test_program_name,
        }
        response = self.client.post('/compile', data=json.dumps(compile_payload), content_type='application/json')
        if response.status_code != 200 or not response.json.get('success'):
            print(f"Setup compilation failed with status code {response.status_code}: {response.json}")

    def tearDown(self):
        self.temp_dir.cleanup()

    def ensure_exe_extension(self, name):
        return f"{name}.exe" if not name.endswith('.exe') else name

    def test_compile_code(self):
        test_program_name = self.temp_dir.name+  '\\test_program2'
        payload = {
            "code": "#include <iostream>\nint main() { std::cout << 'Hello, Universe!'; return 0; }",
            "name": test_program_name,
        }
        response = self.client.post('/compile', data=json.dumps(payload), content_type='application/json')

        self.assertEqual(response.status_code, 200, f"Failed to compile with status code {response.status_code}, response: {response.json}")

    def test_upload_file(self):
        file_path = self.ensure_exe_extension(os.path.join(self.temp_dir.name, 'uploaded_program'))
        with open(file_path, 'wb') as f:
            f.write(b'Fake binary content')

        with open(file_path, 'rb') as f:
            response = self.client.post('/upload_file', data={'file': f, 'name': 'uploaded_program'}, content_type='multipart/form-data')

        self.assertEqual(response.status_code, 200, f"Failed to upload file with status code {response.status_code}, response: {response.json}")

    def test_gdb_command(self):
        gdb_payload = {
            "command": "info locals",
            "name": self.test_program_name
        }
        response = self.client.post('/gdb_command', data=json.dumps(gdb_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to execute GDB command with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to execute GDB command: {response.json}")

    def test_set_breakpoint(self):
        breakpoint_payload = {
            "location": "main",
            "name": self.test_program_name
        }
        response = self.client.post('/set_breakpoint', data=json.dumps(breakpoint_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to set breakpoint with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to set breakpoint: {response.json}")

    def test_info_breakpoints(self):
        breakpoint_payload = {
            "location": "main",
            "name": self.test_program_name
        }
        self.client.post('/set_breakpoint', data=json.dumps(breakpoint_payload), content_type='application/json')

        info_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/info_breakpoints', data=json.dumps(info_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to get info breakpoints with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to get info breakpoints: {response.json}")

    def test_stack_trace(self):
        stack_trace_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/stack_trace', data=json.dumps(stack_trace_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to get stack trace with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to get stack trace: {response.json}")

    def test_threads(self):
        threads_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/threads', data=json.dumps(threads_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to get threads with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to get threads: {response.json}")

    def test_get_registers(self):
        get_registers_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/get_registers', data=json.dumps(get_registers_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to get registers with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to get registers: {response.json}")

    def test_get_locals(self):
        get_locals_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/get_locals', data=json.dumps(get_locals_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to get locals with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to get locals: {response.json}")

    def test_run_program(self):
        run_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/run', data=json.dumps(run_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to run program with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to run program: {response.json}")

    def test_memory_map(self):
        memory_map_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/memory_map', data=json.dumps(memory_map_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to get memory map with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to get memory map: {response.json}")

    def test_continue_execution(self):
        continue_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/continue', data=json.dumps(continue_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to continue execution with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to continue execution: {response.json}")

    def test_step_over(self):
        step_over_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/step_over', data=json.dumps(step_over_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to step over with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to step over: {response.json}")

    def test_step_into(self):
        step_into_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/step_into', data=json.dumps(step_into_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to step into with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to step into: {response.json}")

    def test_step_out(self):
        step_out_payload = {
            "name": self.test_program_name
        }
        response = self.client.post('/step_out', data=json.dumps(step_out_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to step out with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to step out: {response.json}")

    def test_add_watchpoint(self):
        add_watchpoint_payload = {
            "variable": "var",
            "name": self.test_program_name
        }
        response = self.client.post('/add_watchpoint', data=json.dumps(add_watchpoint_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to add watchpoint with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to add watchpoint: {response.json}")

    def test_delete_breakpoint(self):
        set_breakpoint_payload = {
            "location": "main",
            "name": self.test_program_name
        }
        self.client.post('/set_breakpoint', data=json.dumps(set_breakpoint_payload), content_type='application/json')

        delete_breakpoint_payload = {
            "location": "1",
            "name": self.test_program_name
        }
        response = self.client.post('/delete_breakpoint', data=json.dumps(delete_breakpoint_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200, f"Failed to delete breakpoint with status code {response.status_code}, response: {response.json}")
        self.assertTrue(response.json['success'], f"Failed to delete breakpoint: {response.json}")

if __name__ == '__main__':
    unittest.main()
