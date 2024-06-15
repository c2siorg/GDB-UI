import unittest
import json
import tempfile
from flask import Flask
from flask_testing import TestCase
from main import app

class TestGDBRoutes(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        return app

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

        compile_payload = {
            "code": "#include <iostream>\nint main() { std::cout << 'Hello, World!'; return 0; }",
            "name": f"{self.temp_dir.name}/test_program",
        }
        self.client.post('/compile', data=json.dumps(compile_payload), content_type='application/json')

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_compile_code(self):
        payload = {
            "code": "#include <iostream>\nint main() { std::cout << 'Hello, Universe!'; return 0; }",
            "name": f"{self.temp_dir.name}/test_program2",
        }
        response = self.client.post('/compile', data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        
    def test_gdb_command(self):
        gdb_payload = {
            "command": "info locals",
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/gdb_command', data=json.dumps(gdb_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_set_breakpoint(self):
        breakpoint_payload = {
            "location": "main",
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/set_breakpoint', data=json.dumps(breakpoint_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_info_breakpoints(self):
        breakpoint_payload = {
            "location": "main",
            "name": f"{self.temp_dir.name}/test_program"
        }
        self.client.post('/set_breakpoint', data=json.dumps(breakpoint_payload), content_type='application/json')

        info_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/info_breakpoints', data=json.dumps(info_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_stack_trace(self):
        stack_trace_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/stack_trace', data=json.dumps(stack_trace_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_threads(self):
        threads_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/threads', data=json.dumps(threads_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_get_registers(self):
        get_registers_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/get_registers', data=json.dumps(get_registers_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_get_locals(self):
        get_locals_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/get_locals', data=json.dumps(get_locals_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_run_program(self):
        run_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/run', data=json.dumps(run_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_memory_map(self):
        memory_map_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/memory_map', data=json.dumps(memory_map_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_continue_execution(self):
        continue_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/continue', data=json.dumps(continue_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_step_over(self):
        step_over_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/step_over', data=json.dumps(step_over_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_step_into(self):
        step_into_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/step_into', data=json.dumps(step_into_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_step_out(self):
        step_out_payload = {
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/step_out', data=json.dumps(step_out_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_add_watchpoint(self):
        add_watchpoint_payload = {
            "variable": "var",
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/add_watchpoint', data=json.dumps(add_watchpoint_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_delete_breakpoint(self):
        set_breakpoint_payload = {
            "location": "main",
            "name": f"{self.temp_dir.name}/test_program"
        }
        self.client.post('/set_breakpoint', data=json.dumps(set_breakpoint_payload), content_type='application/json')

        delete_breakpoint_payload = {
            "breakpoint_number": 1,
            "name": f"{self.temp_dir.name}/test_program"
        }
        response = self.client.post('/delete_breakpoint', data=json.dumps(delete_breakpoint_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

if __name__ == '__main__':
    unittest.main()
