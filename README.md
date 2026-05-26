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

This command will build and start both the frontend and backend services, making the application available at [http://localhost:3000](http://localhost:3000) (or your specified port).

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
2. Navigate to the `gdbui_server` directory:

    ```sh
    cd gdbui_server
    ```

3. Run the tests using the `unittest` module:

    ```sh
    python -m unittest discover -s tests
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

