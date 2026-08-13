# Contributing to GDB-UI

Thanks for your interest in GDB-UI! This project is a web-based UI for the GNU Debugger (GDB), built with a React frontend and a Flask + gevent backend. Contributions are welcome from everyone.

## Project Structure

```
GDB-UI/
├── webapp/          # React (Vite) frontend
│   ├── src/
│   │   ├── components/   # UI components (Terminal, Header, ...)
│   │   ├── context/      # React context (DataContext)
│   │   ├── hooks/        # Custom hooks (useSession, useStreamingOutput)
│   │   └── pages/        # Route pages (Debug, Demo, Home, Login)
│   └── package.json
├── gdbui_server/    # Flask + Socket.IO backend
│   ├── main.py              # Flask app + routes
│   ├── session_manager.py   # Per-session GDB isolation + streaming reader
│   ├── wsgi.py              # gunicorn entrypoint
│   └── tests/               # Python unit tests
└── .github/workflows/       # CI pipelines
```

## Prerequisites

- **Node.js** 18
- **Python** 3.10
- **GDB** — required to run the backend tests that exercise a real debugger. If GDB is not installed locally, run the tests in Docker (`GDBUI_DOCKER=true`).

## Setup

See the **Getting Started** section of the [README](README.md) for Docker and manual setup instructions.

## Development Workflow

1. **Fork** [c2siorg/GDB-UI](https://github.com/c2siorg/GDB-UI) and clone your fork.
2. **Create a branch** off `main`:

   ```sh
   git checkout -b feature/your-feature
   ```

3. **Make your changes.** Keep the diff surgical — fix what the issue/PR asks for, nothing more.
4. **Run the checks** listed below.
5. **Commit** with a clear, imperative message using a conventional prefix:

   ```sh
   git commit -m "feat: add step-out support to the debug toolbar"
   git commit -m "fix: handle session expiry during streaming"
   git commit -m "test: cover session isolation in Demo page"
   ```

6. **Push** and open a pull request against `main` with a description of the change and the test plan.

## Checks

### Frontend (`webapp/`)

```sh
cd webapp
npm install
npm run lint        # ESLint (0 errors required)
npm run build       # production build must succeed
npx vitest run      # unit tests
```

### Backend (`gdbui_server/`)

```sh
cd gdbui_server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

ruff check .        # lint — see ruff.toml for the configured rule set
python -m unittest discover -s tests -p 'test_*.py'
python -m unittest flask_test
```

These exact gates run in CI on every pull request (see `.github/workflows/`):
`test-npm` runs the frontend tests with coverage, ESLint, and the production build; `test` runs the backend tests; `ruff` lints the backend.

## Code Style

- **Frontend:** ESLint with the `eslint.config.cjs` rules. Components use PascalCase, hooks use the `use` prefix.
- **Backend:** Ruff with the curated rule set in `gdbui_server/ruff.toml`. Import sorting (`I001`) is enforced — run `ruff check --fix` before committing.
- **Python:** Keep functions small and focused. Use descriptive, behavior-focused test names.

## Testing Expectations

- New functionality should ship with tests that cover the happy path, error paths, and edge cases.
- The backend targets **80%+ coverage**.
- Run the full suite before opening a PR — don't rely on CI alone.

## Security Notes

GDB-UI exposes a debugger over the network, so security matters:

- Program names and commands are validated server-side (`sanitize_program_name`, `BLOCKED_COMMANDS`). Do not weaken these.
- Each session is isolated: its own GDB process, locks, and `output/{session_id}/` directory. Preserve this isolation.
- Do not add hardcoded credentials or secrets.

## Questions

Open an issue for bugs or questions, or ask in the PR discussion.
