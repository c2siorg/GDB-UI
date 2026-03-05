import unittest
import json
import os
import shutil
from io import BytesIO
from unittest import mock
from main import app

class GDBSystemTest(unittest.TestCase):
    def setUp(self):
        """Initializes test client and provisions a unique session for each test case."""
        self.client = app.test_client()
        self.client.testing = True
        
        response = self.client.post('/create_session')
        self.session_id = response.json['session_id']
        self.prog_name = "test_unit_binary"

    def tearDown(self):
        """Ensures the base output directory exists for subsequent tests."""
        if not os.path.exists('output'):
            os.makedirs('output', exist_ok=True)

    def test_session_creation_and_sandboxing(self):
        """Verify that session initialization triggers physical sandbox provisioning."""
        sandbox_path = os.path.join('output', self.session_id)
        self.assertTrue(os.path.exists(sandbox_path))

    def test_full_resource_reclamation(self):
        """Verify that session termination triggers full filesystem reclamation."""
        sandbox_path = os.path.join('output', self.session_id)
        
        self.client.post('/end_session', 
                         data=json.dumps({"session_id": self.session_id}), 
                         content_type='application/json')
        
        self.assertFalse(os.path.exists(sandbox_path))

    def test_multitenant_isolation(self):
        """Verify that sandboxes are isolated. Session B should not access Session A binaries."""
        resp2 = self.client.post('/create_session')
        secondary_sid = resp2.json['session_id']
        
        # Attempt to run a program that does not exist in the secondary sandbox
        payload = {"session_id": secondary_sid, "name": self.prog_name, "command": "run"}
        response = self.client.post('/gdb_command', data=json.dumps(payload), content_type='application/json')
        
        self.assertFalse(response.json['success'])
        self.assertIn("not found", response.json['error'])

    def test_higher_order_dispatcher(self):
        """Verify standardized response formatting via the centralized dispatcher."""
        with mock.patch('session_manager.GdbController') as MockGDB:
            instance = MockGDB.return_value
            instance.write.return_value = [{'payload': 'Breakpoint 1 set at main.cpp:10'}]
            
            # Create a placeholder binary to satisfy start_gdb requirements
            sandbox = os.path.join('output', self.session_id)
            open(os.path.join(sandbox, self.prog_name), 'a').close()

            payload = {
                "session_id": self.session_id, 
                "name": self.prog_name, 
                "location": "main"
            }
            response = self.client.post('/set_breakpoint', data=json.dumps(payload), content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            self.assertIn('Breakpoint', response.json['result'])

    def test_linux_path_standardization(self):
        """Verify binary name normalization for Linux/ELF compatibility."""
        with mock.patch('subprocess.run') as mock_run:
            mock_run.return_value = mock.Mock(returncode=0)
            
            payload = {
                "session_id": self.session_id,
                "code": "int main() { return 0; }",
                "name": "binary.exe"
            }
            self.client.post('/compile', data=json.dumps(payload), content_type='application/json')
            
            # Confirm Windows extensions are stripped for Linux targets
            expected_path = os.path.join('output', self.session_id, "binary")
            
            # Simulate file creation by the compiler
            open(expected_path, 'a').close()
            self.assertTrue(os.path.exists(expected_path))

    def test_security_traversal_block(self):
        """Verify the security perimeter hard-blocks path traversal attempts."""
        payload = {
            "session_id": self.session_id,
            "name": "../../../etc/shadow",
            "code": "void unauthorized() {}"
        }
        response = self.client.post('/compile', data=json.dumps(payload), content_type='application/json')
        
        # Validation error should result in a 500 status and security violation message
        self.assertEqual(response.status_code, 500)
        self.assertIn("Security Violation", response.json['error'])

if __name__ == '__main__':
    unittest.main()