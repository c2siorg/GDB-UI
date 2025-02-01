# GDB-UI

[![Build Status](https://img.shields.io/github/workflow/status/c2siorg/GDB-UI/CI/main?style=for-the-badge)](https://github.com/c2siorg/GDB-UI/actions)
[![License: MIT](https://img.shields.io/github/license/c2siorg/GDB-UI?style=for-the-badge)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

**GDB-UI** is a modern, web-based user interface for the GNU Debugger (GDB) that enhances your debugging experience. By integrating GDB’s powerful capabilities with an intuitive design, GDB-UI simplifies the process of monitoring program execution, inspecting variables, and setting breakpoints. Perfect for developers working with C, C++, Ada, and more, our tool is designed to streamline your development workflow.

**Repository:** [https://github.com/c2siorg/GDB-UI](https://github.com/c2siorg/GDB-UI)

---

## 🌟 Overview

GDB-UI provides an accessible interface to the robust GNU Debugger. It empowers developers by offering real-time debugging, breakpoint management, and variable inspection through an elegant web-based platform. Whether you are developing complex systems or working on small projects, GDB-UI is built to improve productivity and debugging efficiency.

---

## 🚀 Key Features

- **Modern Web Interface:** Sleek and user-friendly design for ease of use.
- **Full GDB Integration:** Access the complete functionality of GDB.
- **Real-Time Debugging:** Monitor and control program execution in real time.
- **Multi-Language Support:** Ideal for C, C++, Ada, and potentially other languages.
- **Extensible Architecture:** Customize and extend the tool with plugins and additional modules.
- **Comprehensive Testing:** Frontend and backend test suites to ensure stability.
- **Docker and Manual Setup:** Multiple installation options to suit your environment.

---

## 🛠 Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js:** Version 18
- **Python:** Version 3.10
- **Docker & Docker Compose:** (Optional, for containerized setup)
- **Git:** For source control management

---

## ⚡ Getting Started

Follow these instructions to quickly set up and begin using GDB-UI. Choose between the Docker-based or manual installation method based on your preference.

---

## 🔧 System Architecture

GDB-UI is built with a clear separation of concerns:
```
GDB-UI/
├── gdbui_server/  # Backend services
├── webapp/  # Frontend interface
```

- #### Backend (Python Server):
 Handles communication with GDB, processes debugging commands, and serves APIs.
- #### Frontend (React Client): 
Provides the user interface, visualizes debugging data, and interacts with the backend via REST APIs and WebSockets.

- The modular architecture ensures that both components can be developed, tested, and scaled independently.

---

## 📖 Installation

There are two primary methods to install GDB-UI: using Docker or setting up the components manually.

---

### Server Setup

#### Docker Setup

1. **Ensure Docker and Docker Compose are installed on your machine.**
2. **Run the following command:**

    ```sh
    docker-compose up
    ```

This command builds and starts both the frontend and backend services. The application will be available at [http://localhost:3000](http://localhost:3000).

#### Manual Server Setup

1. **Navigate to the `gdbui_server` directory:**

    ```sh
    cd gdbui_server
    ```

2. **Install required Python packages:**

    ```sh
    pip install -r requirements.txt
    ```

3. **Run the backend server:**

    ```sh
    python main.py
    ```

---

### Client Setup

#### Manual Client Setup

1. **Navigate to the `webapp` directory:**

    ```sh
    cd webapp
    ```

2. **Install the necessary dependencies:**

    ```sh
    npm install
    ```

3. **Start the client application:**

    ```sh
    npm run dev
    ```

---

## ⚙️ Run in Development Mode

For a streamlined development workflow:

1. **Server:** Ensure the Python backend is running in development mode.

2. **Client:** Run the React development server with hot-reloading enabled.

3. **Live Reload:** Any changes to the code will automatically update the running application, allowing for efficient iterative development.

---

## 🧩 Core Components

GDB-UI is composed of several core components designed to facilitate efficient debugging.

### Visual Builder

- **User Interface:** A responsive web-based UI built with React.

- **Interactive Elements:** Tools for setting breakpoints, stepping through code, and visualizing program state.

- **Customization:** Easily configurable themes and layouts for personal 
preference.

### Code Translator

- **Command Parser:** Translates user actions into GDB commands.

- **Response Handler:** Interprets responses from GDB and updates the UI accordingly.

- **Error Management:** Provides clear and actionable error messages to assist in troubleshooting.


---

## ⚙️ Development Workflow

To maintain a high standard of code quality and collaboration, please adhere to the following development workflow guidelines.

### Branching Strategy

- **Main Branch:** Always reflects the production-ready state.

- **Feature Branches:** Create separate branches for new features or bug fixes.

- **Naming Convention:** Use clear, descriptive branch names (e.g., `feature/add-breakpoint-ui` or `bugfix/fix-variable-display`).

---

## 🔄 Testing

- **Frontend:**
 Run tests using Vite. Navigate to the `webapp` directory and execute:

    ```sh
    cd webapp
    npm run test
    ```

- **Backend:** 
Execute backend tests by navigating to the `gdbui_server` directory and running:

    ```sh
    cd gdbui_server
    python -m unittest discover -s tests
    ```

#### Note: Ensure that all tests pass before merging any changes.

---

## 📈 Production Deployment

For production deployment, follow these guidelines:

- **Docker:** Use Docker Compose to deploy a stable environment.

- **Environment Variables:** Configure environment-specific variables as needed.

- **CI/CD Pipeline:** Integrate with our CI/CD pipeline for automated testing and deployment.

---

## 🛠 Environment Variables Example

Create an `.env` file at the root of the project with the following example configuration:

```env
# Server Configuration
PORT=3000
DEBUG_MODE=false

# Client Configuration
REACT_APP_API_URL=http://localhost:8000

# Additional configuration variables can be added here
```
Ensure sensitive information is managed securely using environment variable management tools or secrets managers.

---

## 🤝 Contributing

We value contributions from the community! To contribute to GDB-UI, please follow these steps:

1. **Fork the repository:** https://github.com/c2siorg/GDB-UI


2. **Clone your fork:**
```
git clone https://github.com/your-username/GDB-UI.git
```
3. **Create a new branch:**
```
git checkout -b feature-or-bugfix-name
```
4. **Make your changes and write clear, descriptive commit messages.**


5. **Push your branch to your fork:**
```
git push origin feature-or-bugfix-name
```

6. **Open a pull request:** on the main repository with a detailed description of your changes. 

For further details, refer to our [CONTRIBUTING.md](CONTRIBUTING.md).


---


## 📜 Resource

- Official GDB Documentation: [GDB Manual](README.md)

- React Documentation: [React Docs](https://legacy.reactjs.org/docs/getting-started.html)

- Python Documentation: [Python Docs](https://docs.python.org/3/)

- Docker Documentation: [Docker Docs](https://docs.docker.com/get-started/)

- Figma Design Prototype: [View Design](https://www.figma.com/proto/flJ4HBaH4QhF18RSKGOWwA/GDB-UI?type=design&node-id=111-1101&t=sDAc1dWc1LAfqpaT-0&scaling=min-zoom&page-id=0%3A1&starting-point-node-id=111%3A2956)
---


## 📜 License

Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

---


## 📞 Support

If you need help or have any questions, please consider the following support options:

- **GitHub Issues:** Report bugs or request features via [GitHub Issues](https://github.com/c2siorg/GDB-UI/issues).


- **Community Discussions:** Participate in discussions on our GitHub Discussions page.

---
Thank you for choosing **GDB-UI**. We hope this tool enhances your debugging workflow and accelerates your development process. Happy debugging!

#### Maintained with passion by the GDB-UI team.

---

