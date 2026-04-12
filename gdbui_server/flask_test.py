import json
import unittest
from io import BytesIO
from unittest import mock

from flask_testing import TestCase

from main import app


class TestGDBRoutes(TestCase):
    def create_app(self):
        app.config["TESTING"] = True
        return app

    def assert_success_response(self, response):
        body = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(body["success"])
        self.assertIn("data", body)
        self.assertNotIn("error", body)
        self.assertNotIn("code", body)
        self.assertIn("X-Correlation-ID", response.headers)
        self.assertTrue(response.headers["X-Correlation-ID"])
        return body

    def assert_error_response(self, response, expected_status):
        body = json.loads(response.data)
        self.assertEqual(response.status_code, expected_status)
        self.assertFalse(body["success"])
        self.assertIn("error", body)
        self.assertNotIn("data", body)
        self.assertNotIn("code", body)
        self.assertIn("message", body["error"])
        self.assertIn("trace_id", body["error"])
        self.assertIn("X-Correlation-ID", response.headers)
        self.assertEqual(body["error"]["trace_id"], response.headers["X-Correlation-ID"])
        return body

    @mock.patch("main.subprocess.run")
    def test_compile_code(self, mock_run):
        mock_run.return_value = mock.Mock(returncode=0, stderr="")
        payload = {
            "code": '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }',
            "name": "test_program",
        }

        response = self.client.post("/compile", data=json.dumps(payload), content_type="application/json")
        body = self.assert_success_response(response)
        self.assertEqual(body["data"]["output"], "Compilation successful.")

    @mock.patch("main.subprocess.run")
    def test_compile_code_failure(self, mock_run):
        mock_run.return_value = mock.Mock(returncode=1, stderr="compile error")
        payload = {"code": "int main(){", "name": "bad_program"}

        response = self.client.post("/compile", data=json.dumps(payload), content_type="application/json")
        body = self.assert_error_response(response, 400)
        self.assertIn("compile error", body["error"]["message"])

    @mock.patch("main.start_gdb_session")
    @mock.patch("main.execute_gdb_command")
    def test_gdb_routes_success_schema(self, mock_execute, mock_start):
        mock_execute.return_value = "ok"
        mock_start.return_value = None

        route_payloads = [
            ("/gdb_command", {"command": "info locals", "name": "program"}),
            ("/set_breakpoint", {"location": "main", "name": "program"}),
            ("/info_breakpoints", {"name": "program"}),
            ("/stack_trace", {"name": "program"}),
            ("/threads", {"name": "program"}),
            ("/get_registers", {"name": "program"}),
            ("/get_locals", {"name": "program"}),
            ("/run", {"name": "program"}),
            ("/memory_map", {"name": "program"}),
            ("/continue", {"name": "program"}),
            ("/step_over", {"name": "program"}),
            ("/step_into", {"name": "program"}),
            ("/step_out", {"name": "program"}),
            ("/add_watchpoint", {"variable": "var", "name": "program"}),
            ("/delete_breakpoint", {"breakpoint_number": 1, "name": "program"}),
        ]

        for route, payload in route_payloads:
            with self.subTest(route=route):
                response = self.client.post(route, data=json.dumps(payload), content_type="application/json")
                body = self.assert_success_response(response)
                self.assertIn("result", body["data"])

    @mock.patch("main.start_gdb_session")
    @mock.patch("main.execute_gdb_command")
    def test_gdb_route_error_schema(self, mock_execute, mock_start):
        mock_execute.side_effect = RuntimeError("gdb boom")
        mock_start.return_value = None

        response = self.client.post(
            "/gdb_command",
            data=json.dumps({"command": "info locals", "name": "program"}),
            content_type="application/json",
        )

        body = self.assert_error_response(response, 500)
        self.assertIn("gdb boom", body["error"]["message"])

    @mock.patch("werkzeug.datastructures.FileStorage.save")
    def test_upload_file(self, mock_save):
        data = {
            "file": (BytesIO(b"dummy file content"), "test_program"),
            "name": "test_program",
        }

        response = self.client.post("/upload_file", content_type="multipart/form-data", data=data)
        body = self.assert_success_response(response)
        self.assertEqual(body["data"]["message"], "File uploaded successfully")
        self.assertEqual(body["data"]["file_path"], "output/test_program.exe")
        mock_save.assert_called_once()

    def test_upload_file_no_file(self):
        response = self.client.post(
            "/upload_file", content_type="multipart/form-data", data={"name": "test_program"}
        )
        body = self.assert_error_response(response, 400)
        self.assertIn("No file or name provided", body["error"]["message"])

    def test_upload_file_no_name(self):
        response = self.client.post(
            "/upload_file",
            content_type="multipart/form-data",
            data={"file": (BytesIO(b"dummy file content"), "test_program")},
        )
        body = self.assert_error_response(response, 400)
        self.assertIn("No file or name provided", body["error"]["message"])

    def test_upload_file_empty_filename(self):
        response = self.client.post(
            "/upload_file",
            content_type="multipart/form-data",
            data={"file": (BytesIO(b"dummy file content"), ""), "name": "test_program"},
        )
        body = self.assert_error_response(response, 400)
        self.assertIn("No selected file", body["error"]["message"])


if __name__ == "__main__":
    unittest.main()
