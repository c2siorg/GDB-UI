\# Contributing to GDB-UI



Thank you for your interest in contributing to GDB-UI! This guide will help you

get the project running locally and walk you through submitting your first pull request.



\---



\## Table of Contents



\- \[Prerequisites](#prerequisites)

\- \[Forking and Cloning](#forking-and-cloning)

\- \[Running the Project Locally](#running-the-project-locally)

&#x20; - \[Option A: Docker](#option-a-docker)

&#x20; - \[Option B: Manual Setup](#option-b-manual-setup)

\- \[Finding Issues](#finding-issues)

\- \[Submitting a Pull Request](#submitting-a-pull-request)

\- \[Code Style](#code-style)



\---



\## Prerequisites



Make sure you have the following installed before getting started:



\- \[Python 3.8+](https://www.python.org/downloads/) — when installing on Windows,

&#x20; check \*\*"Add python.exe to PATH"\*\* on the first screen

\- \[Node.js LTS](https://nodejs.org/) — use the LTS version

\- \[Git](https://git-scm.com/downloads)

\- \[Docker Desktop](https://www.docker.com/products/docker-desktop) \*(optional, for Docker setup)\*



Verify your installations by running:

```bash

python --version

node --version

git --version

```



\---



\## Forking and Cloning



1\. Go to \[github.com/c2siorg/GDB-UI](https://github.com/c2siorg/GDB-UI)

2\. Click \*\*Fork\*\* (top right) to create your own copy

3\. Clone your fork locally:

```bash

git clone https://github.com/YOUR\_USERNAME/GDB-UI.git

cd GDB-UI

```



4\. Add the original repo as upstream so you can pull future changes:

```bash

git remote add upstream https://github.com/c2siorg/GDB-UI.git

```



\---



\## Running the Project Locally



\### Option A: Docker



If Docker Desktop is running:

```bash

docker-compose up --build

```



Then open \[http://localhost:5173](http://localhost:5173) in your browser.



> \*\*Note for Windows users:\*\* Make sure WSL2 is installed and up to date.

> Run `wsl --update` in an Administrator PowerShell if Docker fails to start.



\---



\### Option B: Manual Setup (Recommended for Windows)



The project has two parts — a Python/Flask backend and a React frontend.

Run each in a separate terminal window.



\#### Terminal 1 — Backend

```bash

cd gdbui\_server

python -m venv venv



\# Windows:

venv\\Scripts\\activate

\# Mac/Linux:

source venv/bin/activate



pip install -r requirements.txt

python main.py

```



The backend will start on \[http://localhost:10000](http://localhost:10000).



\#### Terminal 2 — Frontend

```bash

cd webapp

npm install

npm run dev

```



The frontend will start on \[http://localhost:5173](http://localhost:5173).



> \*\*Note:\*\* GDB must be installed on your system for the debugger features to work.

> On Ubuntu/Debian: `sudo apt install gdb`

> On Mac: `brew install gdb`

> On Windows: Use WSL (Windows Subsystem for Linux) for full GDB support.



\---



\## Finding Issues



Browse open issues at \[github.com/c2siorg/GDB-UI/issues](https://github.com/c2siorg/GDB-UI/issues).



Look for issues labelled:

\- `good first issue` — beginner friendly

\- `bug` — something broken that needs fixing

\- `documentation` — writing or improving docs



Comment on an issue before starting work on it to let maintainers know

you're working on it and avoid duplicate effort.



\---



\## Submitting a Pull Request



1\. Make sure your `main` branch is up to date:

```bash

git checkout main

git pull upstream main

```



2\. Create a new branch for your fix:

```bash

git checkout -b fix/your-branch-name

```



Use a descriptive branch name like `fix/remove-console-logs` or `docs/add-contributing-guide`.



3\. Make your changes, then stage and commit:

```bash

git add .

git commit -m "fix: short description of what you changed"

```



Follow this commit message format:

\- `fix:` for bug fixes

\- `feat:` for new features

\- `docs:` for documentation changes

\- `chore:` for maintenance tasks



4\. Push your branch to your fork:

```bash

git push origin fix/your-branch-name

```



5\. Go to `github.com/YOUR\_USERNAME/GDB-UI` — click \*\*"Compare \& pull request"\*\*



6\. Fill in the PR description:

&#x20;  - What problem does it solve?

&#x20;  - What changes did you make?

&#x20;  - Reference the issue with `Fixes #ISSUE\_NUMBER`



7\. Click \*\*"Create pull request"\*\*



\---



\## Code Style



\- \*\*Python:\*\* Follow \[PEP 8](https://peps.python.org/pep-0008/) conventions

\- \*\*JavaScript/React:\*\* Follow the existing ESLint configuration.

&#x20; Run `npm run lint` to check for issues before submitting

\- Keep PRs small and focused — one issue per PR

\- Add comments to explain non-obvious logic



\---



\## Questions?



Join the \[C2SI Slack](https://c2si.org/gsoc) and post in the `#gdb-ui` channel.

Mentors and contributors are happy to help!

