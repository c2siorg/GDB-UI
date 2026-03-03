# Architecture note: global lock protects dict mutations only (microseconds).
# Per-session locks serialize GDB I/O (milliseconds-seconds).
# controller.write() is never called under the global lock  no deadlock possible.
# To swap backing store  replace SessionManager internals only.
# Flask routes in main.py require zero changes.
import uuid
import threading
import time
import os
import re
import logging
from pygdbmi.gdbcontroller import GdbController

logger = logging.getLogger(__name__)

MAX_SESSIONS = int(os.environ.get('GDBUI_MAX_SESSIONS', 100))
DEFAULT_TTL = 3600
GDB_TIMEOUT = 30

BLOCKED_COMMANDS = frozenset({
    'shell', 'python', 'python-interactive', 'pi', 'source', 'pipe',
    '!',
})


def ensure_exe_extension(name):
    return name if name.endswith('.exe') else name + '.exe'


def sanitize_program_name(name):
    if not name:
        raise ValueError("Program name is required")
    if '..' in name or '/' in name or '\\' in name:
        raise ValueError(f"Invalid program name: {name}")
    basename = os.path.basename(name)
    if not basename or not re.match(r'^[a-zA-Z0-9_\-]+(\.\w+)?$', basename):
        raise ValueError(f"Invalid program name: {name}")
    return basename


def validate_command(command):
    if not command or not command.strip():
        raise ValueError("Command cannot be empty")
    first_word = command.strip().split()[0].lower()
    if first_word in BLOCKED_COMMANDS:
        raise ValueError(f"Command '{first_word}' is not allowed for security reasons")


class SessionManager:
    def __init__(self, session_ttl=DEFAULT_TTL):
        if session_ttl <= 0:
            raise ValueError("session_ttl must be positive")
        self.sessions = {}
        self.session_locks = {}
        self.lock = threading.Lock()
        self.session_ttl = session_ttl
        self._start_cleanup_thread()

    def _start_cleanup_thread(self):
        thread = threading.Thread(target=self._cleanup_expired, daemon=True)
        thread.start()

    def _cleanup_expired(self):
        while True:
            time.sleep(60)
            now = time.time()
            with self.lock:
                expired = [
                    sid for sid, data in self.sessions.items()
                    if now - data['last_active'] > self.session_ttl
                ]
            for sid in expired:
                self._end_session_if_expired(sid)

    def _end_session_if_expired(self, session_id):
        with self.lock:
            session = self.sessions.get(session_id)
            if session is None:
                return
            if time.time() - session['last_active'] <= self.session_ttl:
                return
            session = self.sessions.pop(session_id)
            lock = self.session_locks.pop(session_id, None)
        if session['controller']:
            try:
                session['controller'].exit()
            except Exception as e:
                logger.warning("Failed to exit controller for expired session %s: %s", session_id, e)

    def create_session(self):
        with self.lock:
            if len(self.sessions) >= MAX_SESSIONS:
                raise RuntimeError("Maximum number of sessions reached")
            session_id = str(uuid.uuid4())
            self.sessions[session_id] = {
                'controller': None,
                'program': None,
                'last_active': time.time()
            }
            self.session_locks[session_id] = threading.Lock()
        logger.info("Session created: %s", session_id)
        return session_id

    def session_exists(self, session_id):
        with self.lock:
            return session_id in self.sessions

    def get_session(self, session_id):
        with self.lock:
            session = self.sessions.get(session_id)
            if session is None:
                return None
            return {
                'program': session['program'],
                'last_active': session['last_active'],
            }

    def _get_session_lock(self, session_id):
        with self.lock:
            lock = self.session_locks.get(session_id)
            if lock is None:
                raise RuntimeError(f"Session {session_id} not found")
            return lock

    def _touch(self, session_id):
        with self.lock:
            if session_id in self.sessions:
                self.sessions[session_id]['last_active'] = time.time()

    def end_session(self, session_id):
        with self.lock:
            session = self.sessions.pop(session_id, None)
            lock = self.session_locks.pop(session_id, None)
        if session and session['controller']:
            try:
                session['controller'].exit()
            except Exception as e:
                logger.warning("Failed to exit controller for session %s: %s", session_id, e)
        if session:
            logger.info("Session ended: %s", session_id)

    def start_gdb(self, session_id, program):
        safe_name = sanitize_program_name(program)
        session_lock = self._get_session_lock(session_id)

        with session_lock:
            session_output_dir = os.path.join('output', session_id)
            os.makedirs(session_output_dir, exist_ok=True)

            with self.lock:
                session = self.sessions.get(session_id)
                if session is None:
                    raise RuntimeError(f"Session {session_id} not found")
                if session['program'] == program:
                    return
                old_controller = session['controller']

            if old_controller:
                try:
                    old_controller.exit()
                except Exception as e:
                    logger.warning("Failed to exit old controller for session %s: %s", session_id, e)

            controller = GdbController()
            try:
                exe_path = os.path.join('output', ensure_exe_extension(safe_name))
                controller.write(f"-file-exec-and-symbols {exe_path}", timeout_sec=GDB_TIMEOUT)
                controller.write("run", timeout_sec=GDB_TIMEOUT)
            except Exception:
                try:
                    controller.exit()
                except Exception:
                    pass
                raise

            with self.lock:
                session = self.sessions.get(session_id)
                if session is None:
                    try:
                        controller.exit()
                    except Exception:
                        pass
                    raise RuntimeError(f"Session {session_id} was ended during startup")
                session['controller'] = controller
                session['program'] = program
                session['last_active'] = time.time()

    def execute(self, session_id, command):
        validate_command(command)
        session_lock = self._get_session_lock(session_id)

        with session_lock:
            with self.lock:
                session = self.sessions.get(session_id)
                if session is None:
                    raise RuntimeError(f"Session {session_id} not found")
                controller = session['controller']
                if controller is None:
                    raise RuntimeError("GDB not started for this session")

            response = controller.write(command, timeout_sec=GDB_TIMEOUT)
            self._touch(session_id)

        if response is None:
            raise RuntimeError("No response from GDB")
        result = ""
        for item in response:
            result += "\n " + str(item.get('payload'))
        return result.strip()

    def ensure_program(self, session_id, program):
        self.start_gdb(session_id, program)

    def shutdown(self):
        with self.lock:
            session_ids = list(self.sessions.keys())
        for sid in session_ids:
            self.end_session(sid)
        logger.info("SessionManager shutdown complete")
