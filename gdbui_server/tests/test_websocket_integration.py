"""Integration tests for WebSocket connection lifecycle and streaming output.

Uses flask-socketio's SocketIOTestClient to exercise the real Socket.IO server
in-process, without requiring a real WebSocket connection or running server.

These tests verify the full pipeline:
  create_session -> WebSocket connect -> stream output -> disconnect -> session expiry

Unlike test_websocket_reader.py (which patches socketio.emit at the module level),
these tests use the REAL flask-socketio event loop and dispatch infrastructure.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import gevent
from flask_socketio import SocketIOTestClient

import main
from session_manager import SessionManager


class TestWebSocketIntegration(unittest.TestCase):
    """Integration tests for WebSocket connection lifecycle and streaming."""

    def setUp(self):
        """Create a test SessionManager and patch main.session_manager."""
        self.sm = SessionManager()
        self._patcher = patch.object(main, 'session_manager', self.sm)
        self._patcher.start()

    def tearDown(self):
        self._patcher.stop()
        self.sm.shutdown()

    # ---- helpers ----

    def _create_client(self, session_id, ws_token):
        """Create a SocketIOTestClient and connect to /ws/debug."""
        client = SocketIOTestClient(main.app, main.socketio)
        qs = f'session_id={session_id}&ws_token={ws_token}'
        client.connect(namespace='/ws/debug', query_string=qs)
        return client

    def _safe_disconnect(self, client):
        """Disconnect client if still connected."""
        if client.is_connected(namespace='/ws/debug'):
            client.disconnect(namespace='/ws/debug')

    def _inject_controller(self, session_id, return_value=None, side_effect=None):
        """Inject a mock GDB controller into a session."""
        mock_ctrl = MagicMock()
        if return_value is not None:
            mock_ctrl.get_gdb_response.return_value = return_value
        if side_effect is not None:
            mock_ctrl.get_gdb_response.side_effect = side_effect
        with self.sm.lock:
            self.sm.sessions[session_id]['controller'] = mock_ctrl
        return mock_ctrl

    # ---- connection lifecycle tests ----

    def test_valid_connection_receives_connected_event(self):
        """Valid session_id + ws_token should receive 'connected' event."""
        sid, token = self.sm.create_session()
        client = self._create_client(sid, token)
        try:
            self.assertTrue(client.is_connected(namespace='/ws/debug'))
            received = client.get_received(namespace='/ws/debug')
            self.assertGreaterEqual(len(received), 1)
            self.assertEqual(received[0]['name'], 'connected')
            self.assertEqual(received[0]['args'][0]['session_id'], sid)
        finally:
            self._safe_disconnect(client)

    def test_missing_session_id_rejects_connection(self):
        """No session_id query param should reject the connection."""
        client = SocketIOTestClient(main.app, main.socketio)
        client.connect(namespace='/ws/debug')
        self.assertFalse(client.is_connected(namespace='/ws/debug'))

    def test_invalid_ws_token_rejects_connection(self):
        """Valid session_id but wrong ws_token should reject."""
        sid, _ = self.sm.create_session()
        client = SocketIOTestClient(main.app, main.socketio)
        client.connect(
            namespace='/ws/debug',
            query_string=f'session_id={sid}&ws_token=invalid-token',
        )
        self.assertFalse(client.is_connected(namespace='/ws/debug'))

    def test_unknown_session_id_rejects_connection(self):
        """Non-existent session_id should reject."""
        client = SocketIOTestClient(main.app, main.socketio)
        client.connect(
            namespace='/ws/debug',
            query_string='session_id=00000000-0000-0000-0000-000000000000&ws_token=some-token',
        )
        self.assertFalse(client.is_connected(namespace='/ws/debug'))

    def test_disconnect_does_not_end_session(self):
        """Client disconnect should leave room but session should persist."""
        sid, token = self.sm.create_session()
        client = self._create_client(sid, token)
        self._safe_disconnect(client)
        # Session should still exist
        with self.sm.lock:
            self.assertIn(sid, self.sm.sessions)
        self.sm.end_session(sid)

    def test_multiple_connect_disconnect_idempotent(self):
        """Same credentials should connect/disconnect multiple times."""
        sid, token = self.sm.create_session()
        for _ in range(2):
            client = self._create_client(sid, token)
            self.assertTrue(client.is_connected(namespace='/ws/debug'))
            self._safe_disconnect(client)
        self.sm.end_session(sid)

    # ---- streaming output tests ----

    def test_reader_emits_gdb_output_to_connected_client(self):
        """Reader greenlet should emit gdb_output events arriving at client."""
        sid, token = self.sm.create_session()
        self._inject_controller(sid, return_value=[
            {'type': 'console', 'payload': 'Hello from GDB', 'stream': 'stdout'},
        ])

        client = self._create_client(sid, token)
        self.assertTrue(client.is_connected(namespace='/ws/debug'))
        # clear the 'connected' event
        client.get_received(namespace='/ws/debug')

        self.sm.start_reader(sid)
        greenlet = self.sm.reader_greenlets.get(sid)
        if greenlet:
            gevent.joinall([greenlet], timeout=0.3)
        self.sm.stop_reader(sid)

        received = client.get_received(namespace='/ws/debug')
        gdb_events = [e for e in received if e['name'] == 'gdb_output']
        self.assertGreaterEqual(len(gdb_events), 1)
        payload = gdb_events[0]['args'][0]
        self.assertEqual(payload['type'], 'console')
        self.assertEqual(payload['payload'], 'Hello from GDB')
        self.assertEqual(payload['stream'], 'stdout')

        self._safe_disconnect(client)

    def test_multiple_gdb_output_tokens_delivered_in_order(self):
        """Multiple tokens from GDB should arrive at client in order."""
        sid, token = self.sm.create_session()

        tokens = [
            {'type': 'console', 'payload': 'Token 1', 'stream': 'stdout'},
            {'type': 'console', 'payload': 'Token 2', 'stream': 'stdout'},
            {'type': 'result', 'payload': 'Done', 'stream': 'stdout'},
        ]
        self._inject_controller(sid, side_effect=[
            [tokens[0]], [tokens[1]], [tokens[2]], [], [], [], [], [], [],
        ])

        client = self._create_client(sid, token)
        client.get_received(namespace='/ws/debug')  # clear connected event

        self.sm.start_reader(sid)
        greenlet = self.sm.reader_greenlets.get(sid)
        if greenlet:
            gevent.joinall([greenlet], timeout=0.3)
        self.sm.stop_reader(sid)

        received = client.get_received(namespace='/ws/debug')
        gdb_events = [e for e in received if e['name'] == 'gdb_output']
        # At minimum verify first 3 arrived in order
        payloads = [e['args'][0]['payload'] for e in gdb_events[:3]]
        self.assertEqual(payloads, ['Token 1', 'Token 2', 'Done'])

        self._safe_disconnect(client)

    def test_gdb_output_room_isolation(self):
        """Events emitted to one session's room should not reach other clients."""
        sid_a, token_a = self.sm.create_session()
        sid_b, token_b = self.sm.create_session()

        # Only session A has a controller that returns output
        self._inject_controller(sid_a, return_value=[
            {'type': 'console', 'payload': 'Session A output', 'stream': 'stdout'},
        ])

        client_a = self._create_client(sid_a, token_a)
        client_b = self._create_client(sid_b, token_b)
        self.assertTrue(client_a.is_connected(namespace='/ws/debug'))
        self.assertTrue(client_b.is_connected(namespace='/ws/debug'))

        # Clear connected events
        client_a.get_received(namespace='/ws/debug')
        client_b.get_received(namespace='/ws/debug')

        # Start reader only for session A
        self.sm.start_reader(sid_a)
        greenlet = self.sm.reader_greenlets.get(sid_a)
        if greenlet:
            gevent.joinall([greenlet], timeout=0.3)
        self.sm.stop_reader(sid_a)

        received_a = client_a.get_received(namespace='/ws/debug')
        received_b = client_b.get_received(namespace='/ws/debug')

        gdb_a = [e for e in received_a if e['name'] == 'gdb_output']
        gdb_b = [e for e in received_b if e['name'] == 'gdb_output']

        self.assertGreaterEqual(len(gdb_a), 1)
        self.assertEqual(len(gdb_b), 0)

        self._safe_disconnect(client_a)
        self._safe_disconnect(client_b)
        self.sm.end_session(sid_a)
        self.sm.end_session(sid_b)

    # ---- session expiry tests ----

    def test_session_ended_externally_receives_session_expired(self):
        """When session is removed externally, client should receive session_expired."""
        sid, token = self.sm.create_session()

        # Controller returns empty — no streaming output
        self._inject_controller(sid, return_value=[])

        client = self._create_client(sid, token)
        client.get_received(namespace='/ws/debug')  # clear connected event

        self.sm.start_reader(sid)
        # Let reader run one full iteration (poll with 0.1s timeout)
        gevent.sleep(0.15)

        # Remove session lock directly (bypassing end_session which kills reader)
        with self.sm.lock:
            self.sm.session_locks.pop(sid, None)

        # Drive greenlet — it hits RuntimeError from _get_session_lock,
        # emits session_expired, then exits the loop
        greenlet = self.sm.reader_greenlets.get(sid)
        if greenlet:
            gevent.joinall([greenlet], timeout=0.3)
        self.sm.stop_reader(sid)

        received = client.get_received(namespace='/ws/debug')
        expired_events = [e for e in received if e['name'] == 'session_expired']
        self.assertEqual(len(expired_events), 1)
        self.assertIn('reason', expired_events[0]['args'][0])

        self._safe_disconnect(client)
        # Clean up remaining session state
        self.sm.end_session(sid)

    # ---- edge cases ----

    def test_connect_to_nonexistent_namespace_rejected(self):
        """Connecting to an unregistered namespace should fail."""
        sid, token = self.sm.create_session()
        client = SocketIOTestClient(main.app, main.socketio)
        client.connect(namespace='/ws/nonexistent')
        self.assertFalse(client.is_connected(namespace='/ws/nonexistent'))
        # Ensure main app namespace still works
        client2 = self._create_client(sid, token)
        self.assertTrue(client2.is_connected(namespace='/ws/debug'))
        self._safe_disconnect(client2)


if __name__ == '__main__':
    unittest.main()
