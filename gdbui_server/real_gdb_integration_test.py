"""Real GDB integration tests for per-session isolation.

Prerequisites:
- GDB installed on system (gdb --version)
- g++ installed (g++ --version)
- Flask server running with threaded=True
"""

import requests
import threading
import time
import os
import subprocess
import unittest

BASE_URL = "http://localhost:10000"

# Auto-detect if server is running on port 10000 or 5000
try:
    resp = requests.post("http://localhost:10000/create_session", json={}, timeout=1)
    if resp.status_code in (200, 503):
        BASE_URL = "http://localhost:10000"
except Exception:
    try:
        resp = requests.post("http://localhost:5000/create_session", json={}, timeout=1)
        if resp.status_code in (200, 503):
            BASE_URL = "http://localhost:5000"
    except Exception:
        pass


class TestRealGDBIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Verify GDB is installed
        result = subprocess.run(["gdb", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError("GDB not installed. Install gdb before running integration tests.")
        # Verify g++ is installed
        result_gpp = subprocess.run(["g++", "--version"], capture_output=True, text=True)
        if result_gpp.returncode != 0:
            raise RuntimeError("g++ not installed. Install g++ before running integration tests.")

    def create_session(self):
        resp = requests.post(f"{BASE_URL}/create_session", json={})
        self.assertEqual(resp.status_code, 200)
        return resp.json()["session_id"]

    def end_session(self, session_id):
        requests.post(f"{BASE_URL}/end_session", json={"session_id": session_id})

    def compile_program(self, session_id, code, name):
        resp = requests.post(f"{BASE_URL}/compile", json={
            "session_id": session_id,
            "code": code,
            "name": name
        })
        return resp

    def test_two_sessions_isolated(self):
        """Two sessions debug different programs without interference."""
        sid_a = self.create_session()
        sid_b = self.create_session()

        try:
            code_a = '#include <iostream>\nint main() { std::cout << "A"; return 0; }'
            code_b = '#include <iostream>\nint main() { std::cout << "B"; return 0; }'

            r_a = self.compile_program(sid_a, code_a, "prog_a.cpp")
            r_b = self.compile_program(sid_b, code_b, "prog_b.cpp")

            self.assertTrue(r_a.json()["success"])
            self.assertTrue(r_b.json()["success"])

            requests.post(f"{BASE_URL}/gdb_command", json={
                "session_id": sid_a, "command": "-file-exec-and-symbols prog_a", "name": "prog_a.cpp"
            })
            requests.post(f"{BASE_URL}/gdb_command", json={
                "session_id": sid_b, "command": "-file-exec-and-symbols prog_b", "name": "prog_b.cpp"
            })

            resp_a = requests.post(f"{BASE_URL}/gdb_command", json={
                "session_id": sid_a, "command": "-exec-run", "name": "prog_a.cpp"
            })
            resp_b = requests.post(f"{BASE_URL}/gdb_command", json={
                "session_id": sid_b, "command": "-exec-run", "name": "prog_b.cpp"
            })

            out_a = str(resp_a.json())
            out_b = str(resp_b.json())

            self.assertNotIn("prog_b", out_a)
            self.assertNotIn("prog_a", out_b)

        finally:
            self.end_session(sid_a)
            self.end_session(sid_b)

    def test_concurrent_command_interleaving(self):
        """Fire commands at both sessions simultaneously."""
        sid_a = self.create_session()
        sid_b = self.create_session()

        results = {"a": None, "b": None}
        errors = []

        def commands_a():
            try:
                resp = requests.post(f"{BASE_URL}/gdb_command", json={
                    "session_id": sid_a, "command": "-gdb-version", "name": "test"
                })
                results["a"] = resp.json()
            except Exception as e:
                errors.append(f"A: {e}")

        def commands_b():
            try:
                resp = requests.post(f"{BASE_URL}/gdb_command", json={
                    "session_id": sid_b, "command": "-gdb-version", "name": "test"
                })
                results["b"] = resp.json()
            except Exception as e:
                errors.append(f"B: {e}")

        t_a = threading.Thread(target=commands_a)
        t_b = threading.Thread(target=commands_b)

        t_a.start()
        t_b.start()
        t_a.join()
        t_b.join()

        self.assertEqual(len(errors), 0, f"Concurrent errors: {errors}")
        self.assertIsNotNone(results["a"])
        self.assertIsNotNone(results["b"])

        self.end_session(sid_a)
        self.end_session(sid_b)

    def test_ttl_cleanup_after_disconnect(self):
        """Simulate browser close and verify automatic cleanup."""
        sid = self.create_session()
        
        # Compile a dummy program to trigger output directory creation
        code = 'int main() { return 0; }'
        self.compile_program(sid, code, "test_ttl.cpp")
        
        output_dir = f"output/{sid}"
        self.assertTrue(os.path.exists(output_dir))

        self.end_session(sid)
        time.sleep(0.5)
        self.assertFalse(os.path.exists(output_dir))

    def test_compile_while_debugging_returns_409(self):
        """Compiling while GDB is running should return 409 Conflict."""
        sid = self.create_session()

        try:
            code = '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }'
            r1 = self.compile_program(sid, code, "hello.cpp")
            self.assertTrue(r1.json()["success"])

            requests.post(f"{BASE_URL}/gdb_command", json={
                "session_id": sid, "command": "-file-exec-and-symbols hello", "name": "hello.cpp"
            })

            r2 = self.compile_program(sid, code, "hello.cpp")
            self.assertEqual(r2.status_code, 409)

        finally:
            self.end_session(sid)

    def test_path_traversal_blocked(self):
        """Path traversal attempts must be blocked before reaching filesystem."""
        sid = self.create_session()

        try:
            resp = requests.post(f"{BASE_URL}/compile", json={
                "session_id": sid,
                "code": "int main() { return 0; }",
                "name": "../../../etc/passwd"
            })
            self.assertEqual(resp.status_code, 400)
            self.assertIn("invalid", resp.json().get("error", "").lower())
        finally:
            self.end_session(sid)


if __name__ == "__main__":
    unittest.main()
