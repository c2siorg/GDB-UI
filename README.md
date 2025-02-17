# GDB-UI

## Table of Contents
- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
  - [Docker Setup](#docker-setup)
  - [Manual Setup](#manual-setup)
- [Usage](#usage)
- [Running Tests](#running-tests)
  - [Frontend Tests (Vite)](#frontend-tests-vite)
  - [Backend Tests](#backend-tests)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Project Overview

GDB-UI simplifies the debugging process by integrating the powerful features of the GNU Debugger (GDB) with an easy-to-use web interface. This project supports various programming languages, including C, C++, Ada, and others, allowing developers to observe what a program is doing while it's running. This is particularly useful for debugging and fixing issues in the code.

## Getting Started

### Docker Setup
The quickest way to get started with GDB-UI is by using Docker.

1. Ensure Docker and Docker Compose are installed on your machine.
2. Run the following command in your terminal:
   ```sh
   docker-compose up

   This command will build and start both the frontend and backend services, making the application available at http://localhost:3000.

Manual Setup
If you prefer a manual setup or are unable to use Docker, follow these steps.

Prerequisites
Node.js: Version 18
Python: Version 3.10
Frontend Setup (React)
Navigate to the webapp directory:
sh
cd webapp
Install the necessary dependencies:
sh
npm install
Start the development server:
sh
npm run dev
Backend Setup (Python Server)
Navigate to the gdbui_server directory:
sh
cd gdbui_server
Install the required Python packages:
sh
pip install -r requirements.txt
Run the backend server:
sh
python main.py
Usage
After setting up the project, you can access the GDB-UI by navigating to http://localhost:3000 in your web browser. Here are some examples of how to use the application:

Debugging a Program: [Include a screenshot or GIF]
Setting Breakpoints: [Include a screenshot or GIF]
Viewing Variables: [Include a screenshot or GIF]
For more detailed usage instructions, refer to the User Guide.

Running Tests
Frontend Tests (Vite)
To run the frontend tests, follow these steps:

Navigate to the webapp directory:
sh
cd webapp
Run the tests using Vite:
sh
npm run test
Backend Tests
To run the backend tests, use the following procedure:

Ensure your Python environment is set up as described in the manual setup.
Navigate to the gdbui_server directory:
sh
cd gdbui_server
Run the tests using the unittest module:
sh
python -m unittest discover -s tests
Contributing
We welcome contributions to the GDB-UI project! To contribute, please follow these guidelines:

Fork the repository.
Create a new branch for your feature or bugfix:
sh
git checkout -b my-feature-branch
Make your changes and commit them with a clear message:
sh
git commit -m "Add my new feature"
Push your changes to your fork:
sh
git push origin my-feature-branch
Open a pull request to the main repository.
Please ensure your code follows our coding standards and includes tests where applicable.

License
This project is licensed under the MIT License. See the LICENSE file for more details.

Contact
If you have any questions or need support, please reach out to the project maintainers:

Deepak Jain
Shubh Mehta
You can also open an issue on the GitHub repository.