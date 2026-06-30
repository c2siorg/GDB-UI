"""Unit tests for the per-session reader greenlet."""

import unittest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from session_manager import SessionManager


class TestWebSocketReader(unittest.TestCase):

    def setUp(self):
        self.sm = SessionManager()

    def tearDown(self):
        self.sm.shutdown()

    def test_start_reader_creates_greenlet(self):
        """start_reader should add a greenlet to reader_greenlets."""
        sid, _ = self.sm.create_session()
        self.sm.start_reader(sid)
        self.assertIn(sid, self.sm.reader_greenlets)
        self.assertIn(sid, self.sm.reader_stop_events)
        self.sm.stop_reader(sid)

    def test_stop_reader_cleans_up(self):
        """stop_reader should remove greenlet and stop event."""
        sid, _ = self.sm.create_session()
        self.sm.start_reader(sid)
        self.sm.stop_reader(sid)
        self.assertNotIn(sid, self.sm.reader_greenlets)
        self.assertNotIn(sid, self.sm.reader_stop_events)

    def test_start_reader_is_idempotent(self):
        """Calling start_reader twice should not create duplicate greenlets."""
        sid, _ = self.sm.create_session()
        self.sm.start_reader(sid)
        first_greenlet = self.sm.reader_greenlets[sid]
        self.sm.start_reader(sid)  # second call
        self.assertIs(self.sm.reader_greenlets[sid], first_greenlet)
        self.sm.stop_reader(sid)

    def test_stop_reader_is_safe_without_start(self):
        """stop_reader on a session without a reader should not raise."""
        sid, _ = self.sm.create_session()
        self.sm.stop_reader(sid)  # should not raise

    def test_reader_stops_on_session_end(self):
        """end_session should stop the reader greenlet."""
        sid, _ = self.sm.create_session()
        self.sm.start_reader(sid)
        self.assertIn(sid, self.sm.reader_greenlets)
        self.sm.end_session(sid)
        self.assertNotIn(sid, self.sm.reader_greenlets)
        self.assertNotIn(sid, self.sm.reader_stop_events)

    def test_reader_stops_on_stop_gdb(self):
        """stop_gdb should stop the reader greenlet."""
        sid, _ = self.sm.create_session()
        self.sm.start_reader(sid)
        self.assertIn(sid, self.sm.reader_greenlets)
        self.sm.stop_gdb(sid)
        self.assertNotIn(sid, self.sm.reader_greenlets)
        self.assertNotIn(sid, self.sm.reader_stop_events)

    def test_reader_emits_on_gdb_output(self):
        """Reader should emit gdb_output events for GDB responses."""
        sid, _ = self.sm.create_session()

        mock_controller = MagicMock()
        mock_controller.get_gdb_response.return_value = [
            {'type': 'console', 'payload': 'Hello from GDB', 'stream': 'stdout'},
        ]

        with self.sm.lock:
            self.sm.sessions[sid]['controller'] = mock_controller

        with patch('main.socketio') as mock_socketio:
            self.sm.start_reader(sid)

            # Let the greenlet run one iteration via joinall
            greenlet = self.sm.reader_greenlets.get(sid)
            if greenlet:
                import gevent
                gevent.joinall([greenlet], timeout=0.3)

            self.sm.stop_reader(sid)

            # Verify emit was called with correct room and namespace
            mock_socketio.emit.assert_any_call(
                'gdb_output',
                {'type': 'console', 'payload': 'Hello from GDB', 'stream': 'stdout'},
                room=sid,
                namespace='/ws/debug',
            )
            self.assertGreaterEqual(mock_socketio.emit.call_count, 1)

    def test_reader_exits_when_controller_gone(self):
        """Reader should exit when the session controller is removed."""
        sid, _ = self.sm.create_session()

        mock_controller = MagicMock()
        mock_controller.get_gdb_response.return_value = [
            [{'type': 'console', 'payload': 'first', 'stream': 'stdout'}],
        ]

        with self.sm.lock:
            self.sm.sessions[sid]['controller'] = mock_controller

        emitted = []

        with patch('main.socketio') as mock_socketio:
            mock_socketio.emit.side_effect = lambda *a, **kw: emitted.append(a)

            self.sm.start_reader(sid)

            # Let the greenlet run via joinall
            greenlet = self.sm.reader_greenlets.get(sid)
            if greenlet:
                import gevent
                gevent.joinall([greenlet], timeout=0.5)

            # Remove controller mid-flight
            with self.sm.lock:
                self.sm.sessions[sid]['controller'] = None

            # Give the greenlet another chance to notice
            if greenlet:
                gevent.joinall([greenlet], timeout=0.5)

            self.sm.stop_reader(sid)

            # Should have emitted at least one response
            self.assertGreaterEqual(len(emitted), 1)

    def test_streaming_commands_defined(self):
        """STREAMING_COMMANDS should contain the expected commands."""
        from session_manager import STREAMING_COMMANDS
        for cmd in ('run', 'continue', 'next', 'step', 'finish'):
            self.assertIn(cmd, STREAMING_COMMANDS)
        for mi_cmd in ('-exec-run', '-exec-continue', '-exec-next', '-exec-step', '-exec-finish'):
            self.assertIn(mi_cmd, STREAMING_COMMANDS)

    def test_execute_starts_reader_for_streaming_commands(self):
        """execute() should start the reader for streaming commands."""
        from session_manager import STREAMING_COMMANDS

        sid, _ = self.sm.create_session()

        mock_controller = MagicMock()
        mock_controller.write.return_value = [{'payload': 'ok'}]
        mock_controller.get_gdb_response.return_value = []

        with self.sm.lock:
            self.sm.sessions[sid]['controller'] = mock_controller

        with patch.object(self.sm, 'start_reader') as mock_start:
            self.sm.execute(sid, 'run')
            mock_start.assert_called_once_with(sid)

    def test_execute_does_not_start_reader_for_query_commands(self):
        """execute() should not start the reader for non-streaming commands."""
        sid, _ = self.sm.create_session()

        mock_controller = MagicMock()
        mock_controller.write.return_value = [{'payload': 'ok'}]
        mock_controller.get_gdb_response.return_value = []

        with self.sm.lock:
            self.sm.sessions[sid]['controller'] = mock_controller

        with patch.object(self.sm, 'start_reader') as mock_start:
            self.sm.execute(sid, 'info locals')
            mock_start.assert_not_called()


if __name__ == '__main__':
    unittest.main()
