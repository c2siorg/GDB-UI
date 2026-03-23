"""
GDB-UI WebSocket Proof-of-Concept
==================================
Demonstrates the background reader thread architecture proposed for GDB-UI.

Key claim being proven:
  GDB produces *stopped records asynchronously — not in response to a command.
  A naive implementation that only emits responses to commands will silently
  drop breakpoint hits. This prototype runs a dedicated reader thread per
  session that continuously polls pygdbmi and emits ALL output types,
  including async notify records, to the correct SocketIO room.

Run:
  python server.py

Then open http://localhost:5000 in a browser.
"""

import os
import time
import threading
import json

from flask import Flask, render_template_string, session
from flask_socketio import SocketIO, emit, join_room
from pygdbmi.gdbcontroller import GdbController

# ── App setup ────────────────────────────────────────────────────────────────

app = Flask(__name__)
app.config["SECRET_KEY"] = "gdb-ui-prototype-secret"

# eventlet async mode required for background threads with SocketIO
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

_binary_name = "target.exe" if os.name == "nt" else "target"
TARGET_BINARY = os.path.join(os.path.dirname(os.path.abspath(__file__)), _binary_name)
TARGET_BINARY_GDB = TARGET_BINARY.replace("\\", "/")
BREAKPOINT_LINE = 9

# ── Session store ─────────────────────────────────────────────────────────────
# Maps session_id -> { controller, thread, active }
# This is the architecture proposed for main.py — one GdbController per user,
# isolated behind a lock so concurrent session creation is race-free.

_sessions: dict = {}
_sessions_lock = threading.Lock()


def get_or_create_session(session_id: str) -> dict:
    """
    Thread-safe session factory.

    The check-then-create pattern is NOT atomic without a lock even in CPython:
    two simultaneous requests can both pass the 'if not in' check and both
    create a GdbController, leaking one subprocess. The lock prevents this.
    """
    with _sessions_lock:
        if session_id not in _sessions:
            _sessions[session_id] = {
                "controller": None,   # created lazily on first GDB command
                "thread": None,
                "active": False,
            }
        return _sessions[session_id]


# ── Background GDB reader thread ──────────────────────────────────────────────

def _gdb_reader_thread(session_id: str, controller: GdbController) -> None:
    """
    The critical piece of the WebSocket architecture.

    pygdbmi classifies GDB MI output into three types:
      - 'result'  — synchronous response to a MI command (-break-insert, etc.)
      - 'notify'  — async record GDB produces on its own (*stopped, =thread-created)
      - 'console' — plain text from GDB or the inferior program

    A naive implementation that only emits inside the @socketio.on('gdb_command')
    handler will silently drop 'notify' records — including breakpoint hits —
    because those arrive between commands, not in response to them.

    This thread runs continuously and emits every record type to the correct
    SocketIO room, ensuring the frontend receives breakpoint hits in real time.
    """
    print(f"[reader] thread started for session {session_id[:8]}")

    while True:
        # Check if this session is still alive
        with _sessions_lock:
            sess = _sessions.get(session_id)
            if not sess or not sess.get("active"):
                break

        try:
            responses = controller.get_gdb_response(
                timeout_sec=0.1, raise_error_on_timeout=False
            )
        except Exception as e:
            print(f"[reader] error reading from GDB: {e}")
            break

        for response in responses:
            msg_type = response.get("type")
            message  = response.get("message", "")
            payload  = response.get("payload")

            if msg_type == "notify" and message == "stopped":
                # ── This is the async record the frontend cares most about ──
                # It arrives here because GDB hit the breakpoint — the client
                # sent NO command to trigger this. Polling would never catch it
                # in real time. The reader thread does.
                reason = payload.get("reason", "unknown") if isinstance(payload, dict) else "unknown"
                frame  = payload.get("frame", {})         if isinstance(payload, dict) else {}
                socketio.emit("breakpoint_hit", {
                    "reason":   reason,
                    "line":     frame.get("line", "?"),
                    "func":     frame.get("func", "?"),
                    "file":     os.path.basename(frame.get("fullname", "?")),
                    "variables": _get_locals(controller),
                }, room=session_id)
                print(f"[reader] emitted breakpoint_hit to room {session_id[:8]} — {reason} at line {frame.get('line','?')}")

            elif msg_type == "notify":
                # Emit all other async records too (thread events, library loads)
                socketio.emit("gdb_async", {
                    "message": message,
                    "payload": str(payload)[:200],
                }, room=session_id)

            elif msg_type in ("console", "log"):
                # GDB console output and inferior program output
                socketio.emit("program_output", {
                    "text": str(payload),
                }, room=session_id)

            elif msg_type == "result":
                # Synchronous result record — emit for completeness
                socketio.emit("gdb_result", {
                    "message": message,
                    "payload": str(payload)[:200],
                }, room=session_id)


def _get_locals(controller: GdbController) -> dict:
    """Fetch local variables at the current frame."""
    try:
        resp = controller.write("-stack-list-locals --simple-values", timeout_sec=2)
        for r in resp:
            if r.get("type") == "result" and r.get("message") == "done":
                locals_list = r.get("payload", {}).get("locals", [])
                return {v["name"]: v.get("value", "?") for v in locals_list}
    except Exception:
        pass
    return {}


# ── SocketIO event handlers ───────────────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    sid = session.get("sid") or "anon"
    join_room(sid)
    print(f"[connect] client joined room {sid[:8]}")
    emit("connected", {"session_id": sid[:8]})


@socketio.on("start_debug")
def on_start_debug(data):
    """
    Client requests a new debug session.
    Creates an isolated GdbController, sets a breakpoint, and starts the
    background reader thread before running the program.
    """
    sid = session.get("sid", "anon")
    sess = get_or_create_session(sid)

    # Tear down any existing GDB session for this user
    if sess.get("controller"):
        try:
            sess["controller"].exit()
        except Exception:
            pass
        sess["active"] = False

    # Create a fresh isolated GdbController for this session
    controller = GdbController()
    sess["controller"] = controller
    sess["active"] = True

    # Load the binary
    controller.write(f"-file-exec-and-symbols {TARGET_BINARY_GDB}", timeout_sec=3)

    # On Windows, set breakpoint by function name — more reliable than line numbers
    # before the symbol table is fully indexed
    bp_resp = controller.write(f"-break-insert {BREAKPOINT_LINE}", timeout_sec=3)
    bp_ok = any(r.get("message") == "done" for r in bp_resp)

    emit("session_ready", {
        "binary":     os.path.basename(TARGET_BINARY),
        "breakpoint": BREAKPOINT_LINE,
        "bp_set":     bp_ok,
    })
    print(f"[start_debug] session ready for {sid[:8]}, breakpoint set={bp_ok}")

    # Start the background reader thread BEFORE running the program.
    # This is essential: if we run first and start the reader after,
    # we can miss the *stopped record entirely.
    reader = threading.Thread(
        target=_gdb_reader_thread,
        args=(sid, controller),
        daemon=True,
        name=f"gdb-reader-{sid[:8]}",
    )
    sess["thread"] = reader
    reader.start()

    # Run the program — execution is async; the reader thread will catch *stopped
    controller.write("-exec-run", timeout_sec=2)
    emit("program_running", {"message": "Program running — waiting for breakpoint..."})


@socketio.on("gdb_command")
def on_gdb_command(data):
    """
    Handle an arbitrary MI command from the frontend.
    The reader thread handles async output; this handler handles synchronous
    command-response flow (step, continue, etc.).
    """
    sid = session.get("sid", "anon")
    with _sessions_lock:
        sess = _sessions.get(sid)

    if not sess or not sess.get("controller"):
        emit("error", {"message": "No active debug session"})
        return

    command = data.get("command", "")
    print(f"[command] {sid[:8]} -> {command}")

    try:
        resp = sess["controller"].write(command, timeout_sec=3)
        # Reader thread handles async records; only emit the sync result here
        for r in resp:
            if r.get("type") == "result":
                emit("gdb_result", {
                    "command": command,
                    "message": r.get("message"),
                    "payload": str(r.get("payload", ""))[:300],
                })
    except Exception as e:
        emit("error", {"message": str(e)})


@socketio.on("disconnect")
def on_disconnect():
    sid = session.get("sid", "anon")
    with _sessions_lock:
        sess = _sessions.get(sid)
        if sess:
            sess["active"] = False
            ctrl = sess.get("controller")
            if ctrl:
                try:
                    ctrl.exit()
                except Exception:
                    pass
            del _sessions[sid]
    print(f"[disconnect] cleaned up session {sid[:8]}")


# ── Frontend ──────────────────────────────────────────────────────────────────

HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GDB-UI WebSocket Prototype</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }
  header { background: #1a1f2e; border-bottom: 1px solid #2d3748; padding: 14px 24px; display: flex; align-items: center; gap: 12px; }
  header h1 { font-size: 16px; font-weight: 600; color: #e2e8f0; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: #2d3748; color: #94a3b8; }
  .badge.connected { background: #064e3b; color: #34d399; }
  .layout { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 16px; padding: 16px; height: calc(100vh - 57px); }
  .panel { background: #1a1f2e; border: 1px solid #2d3748; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
  .panel-header { padding: 10px 14px; border-bottom: 1px solid #2d3748; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between; }
  .panel-body { flex: 1; overflow-y: auto; padding: 12px; font-size: 13px; }
  pre { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
  .controls { grid-column: 1 / -1; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  button { padding: 8px 18px; border-radius: 6px; border: none; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: #3b82f6; color: #fff; }
  .btn-secondary { background: #2d3748; color: #e2e8f0; }
  .btn-green { background: #059669; color: #fff; }
  .btn-amber { background: #d97706; color: #fff; }
  input[type=text] { flex: 1; background: #0f1117; border: 1px solid #2d3748; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-family: monospace; font-size: 13px; }
  .log-entry { padding: 4px 0; border-bottom: 1px solid #1e2535; line-height: 1.5; }
  .log-entry:last-child { border-bottom: none; }
  .tag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 3px; margin-right: 6px; font-weight: 600; font-family: monospace; }
  .tag-async { background: #7c3aed; color: #ede9fe; }
  .tag-result { background: #1e40af; color: #dbeafe; }
  .tag-output { background: #065f46; color: #d1fae5; }
  .tag-info  { background: #374151; color: #d1d5db; }
  .tag-hit   { background: #991b1b; color: #fee2e2; }
  .var-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #1e2535; font-family: monospace; font-size: 12px; }
  .var-name { color: #93c5fd; }
  .var-val  { color: #86efac; }
  .highlight { background: #1e3a5f; border-left: 3px solid #3b82f6; padding-left: 8px; border-radius: 0 4px 4px 0; margin: 4px 0; }
  #status-text { font-size: 13px; color: #64748b; }
  .breakpoint-line { background: #3b1a1a; border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 0 4px 4px 0; font-family: monospace; font-size: 12px; margin: 4px 0; }
</style>
</head>
<body>
<header>
  <h1>GDB-UI &mdash; WebSocket Prototype</h1>
  <span id="conn-badge" class="badge">disconnected</span>
  <span style="margin-left:auto;font-size:12px;color:#475569">Proof of concept for GSoC 2026 proposal</span>
</header>

<div class="layout">

  <div class="controls">
    <button class="btn-primary" id="btn-start" onclick="startDebug()">&#9654; Start debug session</button>
    <button class="btn-green" id="btn-continue" onclick="sendCmd('-exec-continue')" disabled>Continue</button>
    <button class="btn-secondary" id="btn-step" onclick="sendCmd('-exec-next')" disabled>Step over</button>
    <button class="btn-secondary" id="btn-step-in" onclick="sendCmd('-exec-step')" disabled>Step into</button>
    <input type="text" id="cmd-input" placeholder="GDB MI command  (e.g. -stack-list-frames)" onkeydown="if(event.key==='Enter')sendRawCmd()">
    <button class="btn-secondary" onclick="sendRawCmd()">Send</button>
    <span id="status-text">Click &ldquo;Start debug session&rdquo; to begin</span>
  </div>

  <!-- Event log -->
  <div class="panel">
    <div class="panel-header">
      <span>Event log</span>
      <span id="event-count" style="color:#475569;font-weight:400">0 events</span>
    </div>
    <div class="panel-body" id="event-log"></div>
  </div>

  <!-- Variables -->
  <div class="panel">
    <div class="panel-header">
      <span>Local variables</span>
      <span id="frame-info" style="color:#475569;font-weight:400">&mdash;</span>
    </div>
    <div class="panel-body" id="var-panel">
      <span style="color:#475569;font-size:12px">Variables will appear when a breakpoint is hit</span>
    </div>
  </div>

  <!-- Source view -->
  <div class="panel">
    <div class="panel-header">Source &mdash; target.c</div>
    <div class="panel-body">
      <pre id="source-view">{{ source }}</pre>
    </div>
  </div>

  <!-- GDB output -->
  <div class="panel">
    <div class="panel-header">
      <span>GDB output</span>
      <button class="btn-secondary" style="padding:2px 8px;font-size:11px" onclick="clearOutput()">Clear</button>
    </div>
    <div class="panel-body" id="gdb-output"></div>
  </div>

</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.min.js"></script>
<script>
const socket = io({ transports: ['websocket'] });
let eventCount = 0;
let atBreakpoint = false;

// ── Connection ────────────────────────────────────────────────────────────────
socket.on('connect', () => {
  badge('connected', true);
  logEvent('info', 'WebSocket connected — session open');
});
socket.on('disconnect', () => {
  badge('disconnected', false);
  logEvent('info', 'WebSocket disconnected');
  setBreakpointButtons(false);
});
socket.on('connected', data => {
  logEvent('info', `Session ID: ${data.session_id}`);
});

// ── Debug lifecycle ───────────────────────────────────────────────────────────
socket.on('session_ready', data => {
  status(`Session ready — binary: ${data.binary}, breakpoint line ${data.breakpoint} (set: ${data.bp_set})`);
  logEvent('info', `Breakpoint set on line ${data.breakpoint} of ${data.binary}`);
  highlightSourceLine(data.breakpoint, false);
});
socket.on('program_running', data => {
  status(data.message);
  logEvent('info', data.message);
});

// ── THE KEY EVENT: async breakpoint hit arriving without a client command ────
socket.on('breakpoint_hit', data => {
  atBreakpoint = true;
  setBreakpointButtons(true);

  const msg = `BREAKPOINT HIT — ${data.func}() line ${data.line} in ${data.file} (${data.reason})`;
  status(msg);

  // Log it prominently
  const entry = document.createElement('div');
  entry.className = 'log-entry highlight';
  entry.innerHTML = `<span class="tag tag-hit">ASYNC</span><strong>${msg}</strong>
  <br><small style="color:#94a3b8;margin-left:4px">This record arrived unprompted — no command was sent. Polling cannot catch this in real time.</small>`;
  document.getElementById('event-log').prepend(entry);
  eventCount++;
  document.getElementById('event-count').textContent = eventCount + ' events';

  // Render variables
  renderVariables(data.variables, data.func, data.line);

  // Highlight the line in source
  highlightSourceLine(parseInt(data.line), true);
});

// ── Other async records ───────────────────────────────────────────────────────
socket.on('gdb_async', data => {
  logEvent('async', `${data.message}: ${data.payload}`);
});
socket.on('gdb_result', data => {
  logEvent('result', `${data.message || ''} ${data.payload || ''}`);
});
socket.on('program_output', data => {
  if (data.text && data.text.trim()) logEvent('output', data.text.trim());
});
socket.on('error', data => {
  logEvent('info', 'Error: ' + data.message);
});

// ── Controls ──────────────────────────────────────────────────────────────────
function startDebug() {
  document.getElementById('btn-start').disabled = true;
  document.getElementById('event-log').innerHTML = '';
  document.getElementById('gdb-output').innerHTML = '';
  eventCount = 0;
  atBreakpoint = false;
  setBreakpointButtons(false);
  renderVariables({}, '', '');
  status('Starting debug session...');
  socket.emit('start_debug', {});

  // Re-enable start button after 3s
  setTimeout(() => { document.getElementById('btn-start').disabled = false; }, 3000);
}

function sendCmd(cmd) {
  socket.emit('gdb_command', { command: cmd });
  atBreakpoint = false;
  setBreakpointButtons(false);
  logEvent('info', `Sent: ${cmd}`);
}

function sendRawCmd() {
  const inp = document.getElementById('cmd-input');
  if (!inp.value.trim()) return;
  sendCmd(inp.value.trim());
  inp.value = '';
}

function clearOutput() {
  document.getElementById('gdb-output').innerHTML = '';
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function logEvent(type, text) {
  const tagMap = { async: 'tag-async', result: 'tag-result', output: 'tag-output', info: 'tag-info' };
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="tag ${tagMap[type] || 'tag-info'}">${type.toUpperCase()}</span>${escHtml(text)}`;
  document.getElementById('event-log').prepend(entry);
  document.getElementById('gdb-output').prepend(entry.cloneNode(true));
  eventCount++;
  document.getElementById('event-count').textContent = eventCount + ' events';
}

function renderVariables(vars, func, line) {
  const panel = document.getElementById('var-panel');
  document.getElementById('frame-info').textContent = func ? `${func}() line ${line}` : '—';
  if (!vars || Object.keys(vars).length === 0) {
    panel.innerHTML = '<span style="color:#475569;font-size:12px">No locals at current frame</span>';
    return;
  }
  panel.innerHTML = Object.entries(vars).map(([k, v]) =>
    `<div class="var-row"><span class="var-name">${escHtml(k)}</span><span class="var-val">${escHtml(v)}</span></div>`
  ).join('');
}

function highlightSourceLine(lineNum, active) {
  const pre = document.getElementById('source-view');
  const lines = pre.dataset.raw.split('\\n');
  pre.innerHTML = lines.map((l, i) => {
    const n = i + 1;
    const isBreakpoint = (n === {{ BREAKPOINT_LINE }});
    const isActive = active && (n === lineNum);
    const lineText = `<span style="color:#475569;user-select:none;margin-right:8px">${String(n).padStart(2)}</span>${escHtml(l)}`;
    if (isActive) return `<div class="breakpoint-line">${lineText}  <span style="color:#ef4444">&larr; stopped here</span></div>`;
    if (isBreakpoint) return `<div style="background:#1a0a0a;border-left:3px solid #7f1d1d;padding:2px 10px;margin:1px 0">${lineText}  <span style="color:#7f1d1d">&#11044;</span></div>`;
    return `<div style="padding:2px 2px">${lineText}</div>`;
  }).join('');
}

function badge(text, connected) {
  const el = document.getElementById('conn-badge');
  el.textContent = text;
  el.className = 'badge' + (connected ? ' connected' : '');
}
function status(text) { document.getElementById('status-text').textContent = text; }
function setBreakpointButtons(enabled) {
  document.getElementById('btn-continue').disabled = !enabled;
  document.getElementById('btn-step').disabled = !enabled;
  document.getElementById('btn-step-in').disabled = !enabled;
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Store raw source for re-rendering
document.getElementById('source-view').dataset.raw = document.getElementById('source-view').textContent;
highlightSourceLine({{ BREAKPOINT_LINE }}, false);
</script>
</body>
</html>
"""


@app.route("/")
def index():
    import uuid
    # Assign a stable session ID per browser session
    if "sid" not in session:
        session["sid"] = str(uuid.uuid4())

    # Read the C source to render in the frontend
    src_path = os.path.join(os.path.dirname(__file__), "target.c")
    try:
        with open(src_path) as f:
            source = f.read()
    except FileNotFoundError:
        source = "/* target.c not found — run: gcc -g -O0 -o target target.c */"

    html = HTML.replace("{{ source }}", source)
    html = html.replace("{{ BREAKPOINT_LINE }}", str(BREAKPOINT_LINE))
    return html


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if __name__ == "__main__":
      binary = TARGET_BINARY
      if not os.path.exists(binary):
        print("ERROR: target binary not found.")
        print("Run:  gcc -g -O0 -o target target.c")
        raise SystemExit(1)

    print("=" * 60)
    print("GDB-UI WebSocket Proof-of-Concept")
    print("=" * 60)
    print(f"  Target binary : {binary}")
    print(f"  Breakpoint    : target.c line {BREAKPOINT_LINE}")
    print(f"  URL           : http://localhost:5000")
    print()
    print("What to observe:")
    print("  1. Click 'Start debug session'")
    print("  2. Watch the BREAKPOINT HIT event arrive in the event log")
    print("     — no command was sent to trigger it")
    print("  3. Local variables appear automatically (x=10, y=20)")
    print("  4. Line 9 highlights in the source panel")
    print("  5. Click 'Continue' or 'Step over' to resume")
    print("=" * 60)

    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
