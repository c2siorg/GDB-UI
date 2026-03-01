import unittest
import threading
import time
from unittest import mock
from unittest.mock import MagicMock, patch

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from session_manager import SessionManager, MAX_SESSIONS, validate_command, sanitize_program_name


class TestSessionManager(unittest.TestCase):

    def _make_mock_controller(self):
        controller = MagicMock()
        controller.write.return_value = [{'payload': 'mock output'}]
        controller.exit.return_value = None
        return controller

    @patch('session_manager.GdbController')
    def test_two_sessions_independent(self, MockGdbController):
        controllers = [self._make_mock_controller(), self._make_mock_controller()]
        MockGdbController.side_effect = controllers

        sm = SessionManager()
        sid_a = sm.create_session()
        sid_b = sm.create_session()

        sm.start_gdb(sid_a, 'program_a')
        sm.start_gdb(sid_b, 'program_b')

        result_a = sm.execute(sid_a, 'info locals')
        result_b = sm.execute(sid_b, 'info locals')

        self.assertIsNotNone(result_a)
        self.assertIsNotNone(result_b)

        controllers[0].write.assert_any_call('info locals', timeout_sec=30)
        controllers[1].write.assert_any_call('info locals', timeout_sec=30)

        self.assertNotEqual(
            id(sm.sessions[sid_a]['controller']),
            id(sm.sessions[sid_b]['controller'])
        )

        sm.shutdown()

    @patch('session_manager.GdbController')
    def test_session_expiry(self, MockGdbController):
        MockGdbController.return_value = self._make_mock_controller()

        sm = SessionManager(session_ttl=1)
        sid = sm.create_session()
        sm.start_gdb(sid, 'program')

        self.assertIsNotNone(sm.get_session(sid))

        time.sleep(2)
        now = time.time()
        with sm.lock:
            expired = [
                s for s, data in sm.sessions.items()
                if now - data['last_active'] > sm.session_ttl
            ]
        for s in expired:
            sm.end_session(s)

        self.assertIsNone(sm.get_session(sid))

    def test_invalid_session_id(self):
        sm = SessionManager()
        with self.assertRaises(RuntimeError) as ctx:
            sm.execute('nonexistent-uuid', 'info locals')
        self.assertIn('not found', str(ctx.exception))

    @patch('session_manager.GdbController')
    def test_end_session_cleanup(self, MockGdbController):
        mock_controller = self._make_mock_controller()
        MockGdbController.return_value = mock_controller

        sm = SessionManager()
        sid = sm.create_session()
        sm.start_gdb(sid, 'program')

        sm.end_session(sid)

        mock_controller.exit.assert_called()
        self.assertIsNone(sm.get_session(sid))

    @patch('session_manager.GdbController')
    def test_concurrent_requests(self, MockGdbController):
        mock_controller = self._make_mock_controller()
        MockGdbController.return_value = mock_controller

        sm = SessionManager()
        sid = sm.create_session()
        sm.start_gdb(sid, 'program')

        errors = []
        results = []

        def worker():
            try:
                result = sm.execute(sid, 'info locals')
                results.append(result)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=10)

        self.assertEqual(len(errors), 0, f"Errors occurred: {errors}")
        self.assertEqual(len(results), 10)

        sm.shutdown()

    def test_max_sessions_limit(self):
        sm = SessionManager()
        for _ in range(MAX_SESSIONS):
            sm.create_session()

        with self.assertRaises(RuntimeError) as ctx:
            sm.create_session()
        self.assertIn('Maximum', str(ctx.exception))

        sm.shutdown()

    @patch('session_manager.GdbController')
    def test_ensure_program_skips_same(self, MockGdbController):
        MockGdbController.return_value = self._make_mock_controller()

        sm = SessionManager()
        sid = sm.create_session()

        sm.ensure_program(sid, 'program_a')
        self.assertEqual(MockGdbController.call_count, 1)

        sm.ensure_program(sid, 'program_a')
        self.assertEqual(MockGdbController.call_count, 1)

        sm.shutdown()

    @patch('session_manager.GdbController')
    def test_ensure_program_switches(self, MockGdbController):
        controllers = [self._make_mock_controller(), self._make_mock_controller()]
        MockGdbController.side_effect = controllers

        sm = SessionManager()
        sid = sm.create_session()

        sm.ensure_program(sid, 'program_a')
        session = sm.get_session(sid)
        self.assertEqual(session['program'], 'program_a')

        sm.ensure_program(sid, 'program_b')
        session = sm.get_session(sid)
        self.assertEqual(session['program'], 'program_b')

        self.assertEqual(MockGdbController.call_count, 2)
        controllers[0].exit.assert_called_once()

        sm.shutdown()

    def test_command_validation_blocks_shell(self):
        with self.assertRaises(ValueError):
            validate_command('shell rm -rf /')
        with self.assertRaises(ValueError):
            validate_command('python print("hack")')
        with self.assertRaises(ValueError):
            validate_command('source evil.py')
        with self.assertRaises(ValueError):
            validate_command('')

    def test_command_validation_allows_normal(self):
        validate_command('info locals')
        validate_command('break main')
        validate_command('next')
        validate_command('bt')

    def test_sanitize_program_name_blocks_traversal(self):
        with self.assertRaises(ValueError):
            sanitize_program_name('../../etc/passwd')
        with self.assertRaises(ValueError):
            sanitize_program_name('../secret')
        with self.assertRaises(ValueError):
            sanitize_program_name('')
        with self.assertRaises(ValueError):
            sanitize_program_name(None)
        with self.assertRaises(ValueError):
            sanitize_program_name('bad name with spaces')

    def test_sanitize_program_name_allows_valid(self):
        self.assertEqual(sanitize_program_name('my_program'), 'my_program')
        self.assertEqual(sanitize_program_name('test-app'), 'test-app')
        self.assertEqual(sanitize_program_name('hello.exe'), 'hello.exe')

    def test_invalid_ttl(self):
        with self.assertRaises(ValueError):
            SessionManager(session_ttl=0)
        with self.assertRaises(ValueError):
            SessionManager(session_ttl=-5)

    @patch('session_manager.GdbController')
    def test_controller_cleanup_on_write_failure(self, MockGdbController):
        controller = self._make_mock_controller()
        controller.write.side_effect = RuntimeError("GDB failed")
        MockGdbController.return_value = controller

        sm = SessionManager()
        sid = sm.create_session()

        with self.assertRaises(RuntimeError):
            sm.start_gdb(sid, 'program')

        controller.exit.assert_called_once()

        sm.shutdown()


if __name__ == '__main__':
    unittest.main()
