import json
import unittest
from io import BytesIO
from unittest import mock

from flask_testing import TestCase

from main import app, session_manager


class TestGDBRoutes(TestCase):
    def create_app(self):
        app.config["TESTING"] = True
        return app

    def setUp(self):
        # Create a session so all routes requiring session_id work
        resp = self.client.post("/create_session", content_type="application/json")
        body = json.loads(resp.data)
        self.session_id = body.get("session_id")

    def assert_v2_success_response(self, response):
        body = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(body["success"])
        self.assertIn("data", body)
        self.assertNotIn("error", body)
        self.assertNotIn("code", body)
        self.assertIn("X-Correlation-ID", response.headers)
        self.assertTrue(response.headers["X-Correlation-ID"])
        return body

    def assert_v2_error_response(self, response, expected_status):
        body = json.loads(response.data)
        self.assertEqual(response.status_code, expected_status)
        self.assertFalse(body["success"])
        self.assertIn("error", body)
        self.assertNotIn("data", body)
        self.assertNotIn("code", body)
        self.assertIn("code", body["error"])
        self.assertIn("message", body["error"])
        self.assertIn("trace_id", body["error"])
        self.assertIn("X-Correlation-ID", response.headers)
        self.assertEqual(body["error"]["trace_id"], response.headers["X-Correlation-ID"])
        return body

    def assert_v2_invalid_request(self, response, expected_message):
        body = self.assert_v2_error_response(response, 400)
        self.assertEqual(body["error"]["code"], "INVALID_REQUEST")
        self.assertEqual(body["error"]["message"], expected_message)
        return body

    def assert_legacy_success_response(self, response):
        body = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(body["success"])
        self.assertNotIn("data", body)
        self.assertNotIn("error", body)
        self.assertNotIn("code", body)
        self.assertIn("X-Correlation-ID", response.headers)
        self.assertTrue(response.headers["X-Correlation-ID"])
        return body

    def assert_legacy_error_response(self, response, expected_status, error_field="error"):
        body = json.loads(response.data)
        self.assertEqual(response.status_code, expected_status)
        self.assertFalse(body["success"])
        self.assertIn(error_field, body)
        self.assertNotIn("data", body)
        self.assertNotIn("code", body)
        self.assertIn("trace_id", body)
        self.assertIn("X-Correlation-ID", response.headers)
        self.assertEqual(body["trace_id"], response.headers["X-Correlation-ID"])
        return body

    @mock.patch("main.subprocess.run")
    def test_compile_code(self, mock_run):
        mock_run.return_value = mock.Mock(returncode=0, stdout="", stderr="")
        payload = {
            "session_id": self.session_id,
            "code": '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }',
            "name": "test_program",
        }

        with mock.patch("builtins.open", mock.mock_open()):
            response = self.client.post("/v2/compile", data=json.dumps(payload), content_type="application/json")
        body = self.assert_v2_success_response(response)
        self.assertEqual(body["data"]["output"], "")

    @mock.patch("main.subprocess.run")
    def test_compile_code_failure(self, mock_run):
        mock_run.return_value = mock.Mock(returncode=1, stderr="compile error")
        payload = {"session_id": self.session_id, "code": "int main(){", "name": "bad_program"}

        with mock.patch("builtins.open", mock.mock_open()):
            response = self.client.post("/v2/compile", data=json.dumps(payload), content_type="application/json")
        body = self.assert_v2_error_response(response, 400)
        self.assertEqual(body["error"]["code"], "COMPILATION_FAILED")

    @mock.patch("main.subprocess.run")
    def test_v2_compile_rejects_missing_payload(self, mock_run):
        response = self.client.post("/v2/compile", content_type="application/json")

        self.assert_v2_invalid_request(response, "Invalid or missing JSON body")
        mock_run.assert_not_called()

    @mock.patch("main.subprocess.run")
    def test_v2_compile_rejects_blank_required_fields(self, mock_run):
        response = self.client.post(
            "/v2/compile",
            data=json.dumps({"session_id": self.session_id, "code": " ", "name": ""}),
            content_type="application/json",
        )

        self.assert_v2_invalid_request(response, "Missing required fields: code, name.")
        mock_run.assert_not_called()

    @mock.patch("main.subprocess.run")
    def test_legacy_compile_schema(self, mock_run):
        mock_run.return_value = mock.Mock(returncode=0, stdout="", stderr="")
        payload = {
            "session_id": self.session_id,
            "code": '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }',
            "name": "test_program",
        }

        with mock.patch("builtins.open", mock.mock_open()):
            response = self.client.post("/compile", data=json.dumps(payload), content_type="application/json")
        body = self.assert_legacy_success_response(response)
        self.assertEqual(body["output"], "")

    @mock.patch("main.session_manager.ensure_program")
    @mock.patch("main.session_manager.execute")
    def test_gdb_routes_success_schema(self, mock_execute, mock_ensure):
        mock_execute.return_value = "ok"
        mock_ensure.return_value = None

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
                payload["session_id"] = self.session_id
                response = self.client.post(f"/v2{route}", data=json.dumps(payload), content_type="application/json")
                body = self.assert_v2_success_response(response)
                self.assertIn("result", body["data"])

    @mock.patch("main.session_manager.ensure_program")
    @mock.patch("main.session_manager.execute")
    def test_v2_gdb_command_rejects_missing_payload(self, mock_execute, mock_ensure):
        response = self.client.post("/v2/gdb_command", content_type="application/json")

        self.assert_v2_invalid_request(response, "Invalid or missing JSON body")
        mock_ensure.assert_not_called()
        mock_execute.assert_not_called()

    @mock.patch("main.session_manager.ensure_program")
    @mock.patch("main.session_manager.execute")
    def test_v2_gdb_routes_reject_missing_required_fields(self, mock_execute, mock_ensure):
        route_payloads = [
            ("/v2/set_breakpoint", {"session_id": self.session_id, "name": "program"}, "Missing required fields: location."),
            ("/v2/info_breakpoints", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/stack_trace", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/threads", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/get_registers", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/get_locals", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/run", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/memory_map", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/continue", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/step_over", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/step_into", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/step_out", {"session_id": self.session_id}, "Missing required fields: name."),
            ("/v2/add_watchpoint", {"session_id": self.session_id, "name": "program"}, "Missing required fields: variable."),
            ("/v2/delete_breakpoint", {"session_id": self.session_id, "breakpoint_number": 1}, "Missing required fields: name."),
        ]

        for route, payload, expected_message in route_payloads:
            with self.subTest(route=route):
                response = self.client.post(route, data=json.dumps(payload), content_type="application/json")
                self.assert_v2_invalid_request(response, expected_message)

        mock_ensure.assert_not_called()
        mock_execute.assert_not_called()

    @mock.patch("main.session_manager.ensure_program")
    @mock.patch("main.session_manager.execute")
    def test_legacy_gdb_route_success_schema(self, mock_execute, mock_ensure):
        mock_execute.return_value = "ok"
        mock_ensure.return_value = None

        response = self.client.post(
            "/gdb_command",
            data=json.dumps({"session_id": self.session_id, "command": "info locals", "name": "program"}),
            content_type="application/json",
        )

        body = self.assert_legacy_success_response(response)
        self.assertEqual(body["result"], "ok")

    @mock.patch("main.session_manager.ensure_program")
    @mock.patch("main.session_manager.execute")
    def test_gdb_route_error_schema(self, mock_execute, mock_ensure):
        mock_execute.side_effect = RuntimeError("gdb boom")
        mock_ensure.return_value = None

        response = self.client.post(
            "/v2/gdb_command",
            data=json.dumps({"session_id": self.session_id, "command": "info locals", "name": "program"}),
            content_type="application/json",
        )

        body = self.assert_v2_error_response(response, 500)
        self.assertEqual(body["error"]["code"], "GDB_COMMAND_FAILED")

    @mock.patch("main.session_manager.ensure_program")
    @mock.patch("main.session_manager.execute")
    def test_legacy_gdb_route_error_schema(self, mock_execute, mock_ensure):
        mock_execute.side_effect = RuntimeError("gdb boom")
        mock_ensure.return_value = None

        response = self.client.post(
            "/gdb_command",
            data=json.dumps({"session_id": self.session_id, "command": "info locals", "name": "program"}),
            content_type="application/json",
        )

        body = self.assert_legacy_error_response(response, 500, error_field="error")
        self.assertEqual(body["error"], "GDB command failed.")

    @mock.patch("werkzeug.datastructures.FileStorage.save")
    def test_upload_file(self, mock_save):
        data = {
            "session_id": self.session_id,
            "file": (BytesIO(b"dummy file content"), "test_program"),
            "name": "test_program",
        }

        response = self.client.post("/v2/upload_file", content_type="multipart/form-data", data=data)
        body = self.assert_v2_success_response(response)
        self.assertEqual(body["data"]["message"], "File uploaded successfully")
        self.assertIn(self.session_id, body["data"]["file_path"])
        mock_save.assert_called_once()

    @mock.patch("werkzeug.datastructures.FileStorage.save")
    def test_legacy_upload_file(self, mock_save):
        data = {
            "session_id": self.session_id,
            "file": (BytesIO(b"dummy file content"), "test_program"),
            "name": "test_program",
        }

        response = self.client.post("/upload_file", content_type="multipart/form-data", data=data)
        body = self.assert_legacy_success_response(response)
        self.assertEqual(body["message"], "File uploaded successfully")
        self.assertIn(self.session_id, body["file_path"])
        mock_save.assert_called_once()

    def test_upload_file_no_file(self):
        # session_id not required here — checked after file/name validation
        response = self.client.post(
            "/v2/upload_file", content_type="multipart/form-data", data={"name": "test_program"}
        )
        body = self.assert_v2_error_response(response, 400)
        self.assertIn("No file or name provided", body["error"]["message"])

    def test_upload_file_no_name(self):
        response = self.client.post(
            "/v2/upload_file",
            content_type="multipart/form-data",
            data={"file": (BytesIO(b"dummy file content"), "test_program")},
        )
        body = self.assert_v2_error_response(response, 400)
        self.assertIn("No file or name provided", body["error"]["message"])

    def test_upload_file_empty_filename(self):
        response = self.client.post(
            "/v2/upload_file",
            content_type="multipart/form-data",
            data={"session_id": self.session_id, "file": (BytesIO(b"dummy file content"), ""), "name": "test_program"},
        )
        body = self.assert_v2_error_response(response, 400)
        self.assertIn("No selected file", body["error"]["message"])


if __name__ == "__main__":
    unittest.main()
