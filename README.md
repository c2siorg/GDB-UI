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
