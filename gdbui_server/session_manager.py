import uuid
import threading
import time
import os
import re
import logging
import shutil
from pygdbmi.gdbcontroller import GdbController

logger = logging.getLogger(__name__)

MAX_SESSIONS = int(os.environ.get('GDBUI_MAX_SESSIONS', 100))
DEFAULT_TTL = 3600
GDB_TIMEOUT = 5

BLOCKED_COMMANDS = frozenset({'shell', 'python', 'python-interactive', 'pi', 'source', 'pipe', '!'})
    
def sanitize_program_name(name):
    """Sanitizes name and ensures Linux/Docker compatibility."""
    if not name: raise ValueError("Program name is required")
    # HARD BLOCK: Prevents any path-climbing or directory switching
    if '/' in name or '\\' in name or '..' in name:
        raise ValueError(f"Security Violation: Path traversal detected in {name}")
    
    clean_name = name.replace('.exe', '')
    if not re.match(r'^[a-zA-Z0-9_\-]+(\.\w+)?$', clean_name):
        raise ValueError(f"Invalid characters in program name: {name}")  
    return clean_name

def validate_command(command):
    """Prevents GDB command injection/hacking."""
    if not command or not command.strip(): raise ValueError("Command cannot be empty")
    if command.strip().split()[0].lower() in BLOCKED_COMMANDS:
        raise ValueError("Security violation: Command blocked.")

class SessionManager:
    def __init__(self, session_ttl=DEFAULT_TTL):
        self.sessions = {}
        self.session_locks = {}
        self.lock = threading.Lock()
        self.session_ttl = session_ttl
        os.makedirs('output', exist_ok=True)
        threading.Thread(target=self._cleanup_expired, daemon=True).start()

    def get_session_dir(self, session_id):
        """Ensures physical workspace isolation per user."""
        path = os.path.join('output', session_id)
        os.makedirs(path, exist_ok=True)
        return path

    def create_session(self):
        """Initializes session state and physical sandbox directory."""
        with self.lock:
            if len(self.sessions) >= MAX_SESSIONS: 
                raise RuntimeError("Max sessions reached")
            sid = str(uuid.uuid4())
            self.sessions[sid] = {'controller': None, 'program': None, 'last_active': time.time()}
            self.session_locks[sid] = threading.Lock()
        self.get_session_dir(sid) 
        logger.info(f"Project Sandbox provisioned for session: {sid}")
        return sid

    def session_exists(self, session_id):
        """API hook for route validation."""
        with self.lock: return session_id in self.sessions

    def end_session(self, session_id):
        """FULL LIFECYCLE CLEANUP: Kills process and wipes folder from disk."""
        with self.lock:
            session = self.sessions.pop(session_id, None)
            self.session_locks.pop(session_id, None)
        if session and session['controller']:
            try: session['controller'].exit()
            except: pass
        
        shutil.rmtree(os.path.join('output', session_id), ignore_errors=True)
        logger.info(f"Session and Sandbox destroyed: {session_id}")

    def start_gdb(self, session_id, program):
        """Starts GDB within the isolated sandbox path."""
        safe_name = sanitize_program_name(program)
        session_lock = self.session_locks.get(session_id)
        if not session_lock: raise RuntimeError("Invalid Session")

        with session_lock:
            session_dir = self.get_session_dir(session_id)
            
            # --- THE ARCHITECT'S FINAL FIX ---
            exe_path = os.path.join(session_dir, safe_name)
            if not os.path.exists(exe_path):
                raise FileNotFoundError(f"Binary {safe_name} not found in sandbox. Compile/Upload first.")
            # ----------------------------------

            with self.lock:
                session = self.sessions.get(session_id)
                if not session: raise RuntimeError("Session not found")
                if session['program'] == program and session['controller']: return
                old_ctrl = session['controller']

            if old_ctrl:
                try: old_ctrl.exit()
                except: pass

            controller = GdbController()
            try:
                controller.write(f"-file-exec-and-symbols {exe_path}", timeout_sec=GDB_TIMEOUT)
                controller.write("run", timeout_sec=GDB_TIMEOUT)
            except Exception as e:
                try: controller.exit()
                except: pass
                raise RuntimeError(f"GDB Error: {str(e)}")

            with self.lock:
                session = self.sessions.get(session_id)
                if not session:
                    try: controller.exit()
                    except: pass
                    raise RuntimeError("Session ended during startup")
                session['controller'] = controller
                session['program'] = program
                session['last_active'] = time.time()

    def execute(self, session_id, command):
        """Executes GDB command and parses result into standardized string."""
        validate_command(command)
        lock = self.session_locks.get(session_id)
        if not lock: raise RuntimeError("Invalid Session")

        with lock:
            session = self.sessions.get(session_id)
            if not session or not session['controller']: raise RuntimeError("GDB not active")
            res = session['controller'].write(command, timeout_sec=GDB_TIMEOUT)
            session['last_active'] = time.time()
            return "\n ".join([str(i.get('payload')) for i in res if i.get('payload')]).strip()

    def _cleanup_expired(self):
        """Background thread logic for automated resource management."""
        while True:
            time.sleep(60)
            now = time.time()
            with self.lock:
                expired = [s for s, d in self.sessions.items() if now - d['last_active'] > self.session_ttl]
            for s in expired: self.end_session(s)

    def shutdown(self):
        """Graceful server exit cleanup."""
        for sid in list(self.sessions.keys()): self.end_session(sid)
        