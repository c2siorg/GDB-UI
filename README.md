# GDB-UI

**GDB-UI** is a user-friendly interface built for the GNU Debugger (GDB), providing a modern web-based UI for debugging your applications. It allows developers to monitor program execution, inspect variables, set breakpoints, and more, all through an intuitive web application.

**GitHub Repository:** [c2siorg/GDB-UI](https://github.com/c2siorg/GDB-UI)

## Project Overview

GDB-UI simplifies the debugging process by integrating the powerful features of GDB with a sleek and easy-to-use web interface. This project is particularly useful for developers working with languages like C, C++, and Ada. The interface offers a more accessible and visual approach to debugging, making it easier to identify and fix issues in your code.

## Getting Started

### Docker Setup

The quickest way to get started with GDB-UI is by using Docker. A `docker-compose.yml` file is provided to handle the entire setup.

1. Ensure Docker and Docker Compose are installed on your machine.
2. Run the following command in your terminal:

    ```sh
    docker-compose up
    ```

This command will build and start both the frontend and backend services, making the application available at [http://localhost:5173](http://localhost:5173) (or your specified port).
backend API runs on (http://localhost:10000)

### Manual Setup

If you prefer a manual setup or are unable to use Docker, follow these steps:

#### Prerequisites

- **Node.js:** Version 18
- **Python:** Version 3.10

#### Frontend Setup (React)

1. Navigate to the `webapp` directory:

    ```sh
    cd webapp
    ```

2. Install the necessary dependencies:

    ```sh
    npm install
    ```

3. Start the development server:

    ```sh
    npm run dev
    ```

#### Backend Setup (Python Server)

1. Navigate to the `gdbui_server` directory:

    ```sh
    cd gdbui_server
    ```

2. Install the required Python packages:

    ```sh
    pip install -r requirements.txt
    ```

3. Run the backend server:

    ```sh
    python main.py
    ```

## Backend API

The backend listens on `http://127.0.0.1:10000` by default.

### Compatibility routes

Existing unversioned routes keep the legacy response shape so current clients can continue reading top-level fields such as `result`, `output`, `message`, and `file_path`. Internal `code` fields are no longer returned.

Example success response from `POST /gdb_command`:

```json
{
  "success": true,
  "result": "..."
}
```

Example error response from `POST /gdb_command`:

```json
{
  "success": false,
  "error": "GDB command failed.",
  "trace_id": "..."
}
```

### V2 routes

Every backend route is also available under `/v2` with the standardized response envelope:

```json
{
  "success": true,
  "data": {
    "result": "..."
  }
}
```

V2 errors return stable client-safe messages and codes. Exception details are logged server-side and correlated with `trace_id`.

```json
{
  "success": false,
  "error": {
    "code": "GDB_COMMAND_FAILED",
    "message": "GDB command failed.",
    "trace_id": "..."
  }
}
```

V2 JSON endpoints validate required fields before running compiler or GDB actions. Missing or blank required fields return `400 Bad Request` with `error.code` set to `INVALID_REQUEST`.

All responses include an `X-Correlation-ID` header. For V2 errors, the header value matches `error.trace_id`.

Available V2 endpoints:

- `POST /v2/compile`
- `POST /v2/upload_file`
- `POST /v2/gdb_command`
- `POST /v2/set_breakpoint`
- `POST /v2/info_breakpoints`
- `POST /v2/stack_trace`
- `POST /v2/threads`
- `POST /v2/get_registers`
- `POST /v2/get_locals`
- `POST /v2/run`
- `POST /v2/memory_map`
- `POST /v2/continue`
- `POST /v2/step_over`
- `POST /v2/step_into`
- `POST /v2/step_out`
- `POST /v2/add_watchpoint`
- `POST /v2/delete_breakpoint`

## Running Tests

### Frontend Tests (Vite)

To run the frontend tests, follow these steps:

1. Navigate to the `webapp` directory:

    ```sh
    cd webapp
    ```

2. Run the tests using Vite:

    ```sh
    npm run test
    ```

### Backend Tests

To run the backend tests, use the following procedure:

1. Ensure your Python environment is set up as described in the manual setup.
2. From the repository root, run the tests using the `unittest` module:

    ```sh
    python3 -m unittest discover -s gdbui_server -p "flask_test.py"
    ```

## Contributing

We welcome contributions from the community! To get started:

1. **Fork the repository at** [c2siorg/GDB-UI](https://github.com/c2siorg/GDB-UI).
2. **Clone your fork:**

    ```sh
    git clone https://github.com/your-username/GDB-UI.git
    ```

3. **Create a new branch for your feature or bugfix:**

    ```sh
    git checkout -b feature-name
    ```

4. **Make your changes and commit them:**

    ```sh
    git commit -m "Description of your changes"
    ```

5. **Push your branch to your fork:**

    ```sh
    git push origin feature-name
    ```

6. **Open a pull request** on the main repository.

**Please ensure your code adheres to our coding standards and is thoroughly tested before submitting your pull request.**


## Design

https://www.figma.com/proto/flJ4HBaH4QhF18RSKGOWwA/GDB-UI?type=design&node-id=111-1101&t=sDAc1dWc1LAfqpaT-0&scaling=min-zoom&page-id=0%3A1&starting-point-node-id=111%3A2956


## Architecture

### Before — Global State (Legacy)

```
User A ──► POST /gdb_command
                  │
User B ──► POST /gdb_command
                  │
                  ▼
         ┌────────────────┐
         │  global state  │  (shared — one GDB for everyone)
         │   gdb_ctrl     │
         │   program_name │
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │  one GDB proc  │  ← User B's request kills User A's session
         └────────────────┘
```

*Problem:* Requests from multiple users overwrite the shared controller.
The second user's `start_gdb_session()` silently kills the first user's GDB process.

### After — Per-Session Isolation

```
User A ──► POST /create_session ──► abc-123
User B ──► POST /create_session ──► def-456

┌────────────────────────────────────────────────────┐
│  SessionManager (in-memory dict)                    │
│                                                     │
│  sessions["abc-123"]   sessions["def-456"]          │
│  ┌─────────────────┐   ┌─────────────────┐          │
│  │ session_lock     │   │ session_lock     │          │
│  │ (threading.RLock)│   │ (threading.RLock)│          │
│  │ controller: GDB  │   │ controller: GDB  │          │
│  │ program: "progA" │   │ program: "progB" │          │
│  │ output/abc-123/  │   │ output/def-456/  │          │
│  └────────┬────────┘   └────────┬────────┘          │
│           │                     │                    │
│  Global lock (dict mutations only — microseconds)    │
│  Per-session lock (GDB I/O — milliseconds/seconds)   │
│  controller.write() NEVER called under global lock   │
└────────────────────────────────────────────────────┘
           │                     │
           ▼                     ▼
   ┌────────────────┐   ┌────────────────┐
   │  GDB proc A    │   │  GDB proc B    │
   │  (isolated)    │   │  (isolated)    │
   └────────────────┘   └────────────────┘
```

### Locking Strategy

```
Request A (thread 1)                 Request B (thread 2)
        │                                   │
        ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│  global lock         │          │  global lock          │
│  (acquire, micros)   │          │  (acquire, micros)    │
│  sessions[sid] lookup│          │  sessions[sid] lookup │
│  (release)           │          │  (release)            │
│  ✓ dict safe         │          │  ✓ dict safe          │
└──────────────────────┘          └──────────────────────┘
        │                                   │
        ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│  session_lock A      │          │  session_lock B      │
│  (acquire, RLock)    │          │  (acquire, RLock)    │
│  controller.write()  │          │  controller.write()  │
│  (release)           │          │  (release)           │
│  ✓ GDB I/O serialized│          │  ✓ GDB I/O serialized│
└──────────────────────┘          └──────────────────────┘
        │                                   │
        ▼                                   ▼
   ┌──────────┐                      ┌──────────┐
   │ GDB A    │                      │ GDB B    │
   └──────────┘                      └──────────┘
```

*Two sessions proceed in parallel because global lock is only held for dict lookups
(microseconds). GDB I/O under per-session locks never collides.*

### File Isolation

```
output/
├── abc-123/          ← User A
│   ├── progA         (binary)
│   ├── progA.cpp     (source)
│   └── progA.exe     (Windows binary)
│
└── def-456/          ← User B
    ├── progB
    ├── progB.cpp
    └── progB.exe
```

*Each session's output directory is created on first use. TTL cleanup or
manual `end_session` removes the entire directory. No cross-session
filesystem access is possible.*


## Deployment Requirements

For development and production, GDB-UI's session manager requires concurrent/threaded execution. Single-threaded configurations will serialize all requests and defeat the per-session GDB isolation mechanism.

### Development (Flask dev server)
The Flask development server runs with `threaded=True` by default since Flask 1.0+. Do not disable threading.
```sh
python main.py
```

### Production (Gunicorn)
For production deployments, Gunicorn must be configured with exactly **1 worker process** and **multiple threads**. Since GDB session metadata and locks are stored in-memory, running with multiple worker processes will cause requests to be routed to different processes where their sessions are not recognized, resulting in `404 Not Found` errors.
```sh
gunicorn -w 1 --threads 4 main:app
```
**Requirements:**
- At least 1 worker with multiple threads (e.g., `--threads 4`).
- Do NOT use: `gunicorn -w 1 --threads 1` (disables concurrency).
- Do NOT use: `gunicorn -w N` (N > 1), as session states are stored in-memory per process.

## Session Lifecycle & Security Model

GDB-UI implements robust multi-user isolation to support multiple concurrent users debugging different programs independently on a single backend instance.

### Session Lifecycle
1. **Creation**: On page mount, the React client requests a new session via `/create_session`. The server generates a unique UUID (e.g., `session_id`), creates isolated output directory `output/{session_id}/`, and registers a reentrant lock `threading.RLock` to serialize debugging operations for that session.
2. **Execution**: Every API request (such as compiling code, setting breakpoints, executing commands) must include the `session_id`. The server routes the command to the session's isolated `pygdbmi.GdbController` instance.
3. **Automatic Cleanup (TTL)**: A background cleanup thread runs every 60 seconds on the server. If a session is inactive for more than the TTL (default: 3600 seconds/1 hour), GDB is closed, the session is removed, and its isolated directory `output/{session_id}/` is deleted.
4. **Manual Termination**: When the webapp unmounts or a user resets their session, the client issues a POST `/end_session` request to trigger immediate cleanup.

### Security Model
- **Isolation Boundary**: Each session runs its own OS-level GDB process. Output files, compilation units, and debugged binaries are isolated under `output/{session_id}/` to prevent cross-session access.
- **Path Traversal Blocking**: Program names are validated using strict sanitization rules (`sanitize_program_name`), preventing path traversal attacks (e.g., passing `../../` to access files outside the session directory).
- **Two-Tier Locking**: A global lock protects the SessionManager's session dictionary structure from concurrent mutations, while per-session `RLock` instances serialize all GDB I/O operations and file compilation/upload phases for each session.
- **Compiling Safely**: When compilation (`/compile`) or file upload (`/upload_file`) is requested, the server locks the session, checks if a debug session is active, and if so, blocks compilation and returns `409 Conflict`. Otherwise, it writes the file and runs the compiler cleanly, updating the program state.
- **Error Resilience**: Malformed GDB Machine Interface (MI) tokens are caught by the `_parse_response` wrapper inside `SessionManager`, returning structured error payloads to the client without terminating the debug session.

### Known Limitations

- **BLOCKED_COMMANDS is not sufficient against expression injection**: The `BLOCKED_COMMANDS` set blocks shell-level commands (`shell`, `python`, `!`, etc.) but does NOT prevent malicious expressions from executing through GDB's expression evaluator. For example, `call system("rm -rf /")` is a valid GDB MI expression that bypasses the command-level blocklist. Full sandboxing requires Phase 3 Docker container isolation.
- **Session ID as sole auth token**: The `session_id` UUID is the only authorization mechanism. This is acceptable for local or trusted-network deployments. Public internet exposure would require additional authentication (signed tokens, user accounts, or HTTPS + HttpOnly cookies).
