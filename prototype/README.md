# GDB-UI WebSocket Proof-of-Concept

Prototype for the GSoC 2026 proposal: **GDB-UI — Web-Based GNU Debugger Interface** (C2SI).

## What this proves

The proposal's most technically ambitious claim is that replacing GDB-UI's polling
architecture with WebSockets requires a **background reader thread** — not just wiring
up Flask-SocketIO. Here is why:

GDB MI output falls into three types:

| Type | Example | When it arrives |
|------|---------|----------------|
| `result` | response to `-break-insert` | synchronously, after your command |
| `notify` | `*stopped` breakpoint hit | **asynchronously — no command triggers it** |
| `console` | program stdout | any time the inferior writes |

A naive WebSocket implementation that only emits inside the `@socketio.on('gdb_command')`
handler will **silently drop breakpoint hits**, because those arrive between commands.

This prototype runs a dedicated reader thread per session (`_gdb_reader_thread`) that
continuously polls `pygdbmi` and emits all record types to the correct SocketIO room.
The browser receives the breakpoint hit in real time — without having sent any command.

## Architecture

```
Browser                    server.py                     GDB process
  |                            |                              |
  |-- start_debug -----------> |                              |
  |                            |-- GdbController() ---------->|
  |                            |-- -file-exec-and-symbols --->|
  |                            |-- -break-insert 9 ---------->|
  |                            |   [start reader thread]      |
  |                            |-- -exec-run ---------------->|
  |                            |                              |
  |                            |   reader thread polls:       |
  |                            |<-- *stopped (notify) --------|
  |<-- breakpoint_hit ---------|                              |
  |   (no command sent!)       |                              |
  |                            |                              |
  |-- gdb_command: -exec-next->|                              |
  |                            |-- -exec-next --------------->|
```

## Files

```
gdb-websocket-prototype/
├── server.py       # Flask-SocketIO backend with background reader thread
├── target.c        # C program with a deliberate breakpoint location
├── target          # compiled binary (build with command below)
└── README.md
```

## Setup

```bash
# 1. Install dependencies
pip install flask flask-socketio pygdbmi eventlet

# 2. Compile the C target (requires gcc and gdb)
gcc -g -O0 -o target target.c

# 3. Run the server
python server.py

# 4. Open http://localhost:5000
```

## What to observe in the browser

1. Click **Start debug session**
2. Watch the **BREAKPOINT HIT** event arrive in the event log — highlighted in red
3. The label says *"This record arrived unprompted — no command was sent"*
4. Local variables (`x = 10`, `y = 20`) appear automatically in the Variables panel
5. Line 9 highlights in the source panel
6. Use **Continue**, **Step over**, or **Step into** to resume execution

## Key code: the reader thread

```python
def _gdb_reader_thread(session_id, controller, socketio):
    while True:
        responses = controller.get_gdb_response(timeout_sec=0.1)
        for response in responses:
            msg_type = response.get('type')
            if msg_type == 'notify' and response.get('message') == 'stopped':
                # Breakpoint hit — arrived with NO client command
                socketio.emit('breakpoint_hit', {...}, room=session_id)
            elif msg_type == 'notify':
                socketio.emit('gdb_async', {...}, room=session_id)
            elif msg_type in ('console', 'log'):
                socketio.emit('program_output', {...}, room=session_id)
```

## Thread-safe session management

Each browser session gets an isolated `GdbController` instance, created behind a lock
to prevent the check-then-create race condition:

```python
_sessions_lock = threading.Lock()

def get_or_create_session(session_id):
    with _sessions_lock:              # atomic check-and-create
        if session_id not in _sessions:
            _sessions[session_id] = {
                'controller': GdbController(),
                'active': True,
            }
        return _sessions[session_id]
```

Without the lock, two simultaneous requests can both pass the `if not in` check and
both create a `GdbController`, leaking one GDB subprocess.

## Relation to main.py in GDB-UI

The current `main.py` uses:
```python
gdb_controller = GdbController()  # global — shared across all requests
```

This prototype replaces that with per-session isolation and demonstrates the
WebSocket architecture that Objective 4 of the proposal implements.
