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
GDB-UI enhances the debugging process by integrating the robust features of the GNU Debugger (GDB) with an intuitive web interface. This project supports multiple programming languages, including C, C++, Ada, and others.

## Getting Started

### Docker Setup
The fastest way to get started with GDB-UI is by utilizing Docker.

1. Ensure Docker and Docker Compose are installed on your machine.
2. Execute the following command in your terminal:
    ```sh
    docker-compose up
    ```
    This command will build and start both the frontend and backend services, making the application accessible at [http://localhost:3000](http://localhost:3000).

### Manual Setup
If you prefer a manual setup or cannot use Docker, follow these steps.

#### Prerequisites
- **Node.js**: Version 18
- **Python**: Version 3.10

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

## Usage
After setting up the project, you can access GDB-UI by navigating to [http://localhost:3000](http://localhost:3000) in your web browser.

For more detailed usage instructions, refer to the [User Guide](https://github.com/c2siorg/GSoC/blob/master/GSoC-2024/13-utkarsh-raj-13-WebiU-20-c2siorg-SCoRe-Lab-website.md?utm_source).

## Running Tests

### Frontend Tests (Vite)
To execute the frontend tests, follow these steps:

1. Navigate to the `webapp` directory:
    ```sh
    cd webapp
    ```
2. Run the tests using Vite:
    ```sh
    npm run test
    ```

### Backend Tests
To execute the backend tests, use the following procedure:

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
We welcome contributions to the GDB-UI project! To contribute, please follow these guidelines:

1. Fork the repository.
2. Create a new branch for your feature or bugfix:
    ```sh
    git checkout -b my-feature-branch
    ```
3. Make your changes and commit them with a clear message:
    ```sh
    git commit -m "Add my new feature"
    ```
4. Push your changes to your fork:
    ```sh
    git push origin my-feature-branch
    ```
5. Open a pull request to the main repository.

Please ensure your code adheres to our coding standards and includes tests where applicable.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact
If you have any questions or need support, please reach out to the project maintainers:

- [Shubh Mehta](https://github.com/Shubh942)
- [Ammoniya](https://github.com/Ammoniya)
- [Abhishek Farshwal](https://github.com/AbhishekFarshwal)
- [@charithccmcb](https://github.com/charithccmcb)
- [charithccmc](https://github.com/charithccmc)

## Design
https://www.figma.com/proto/flJ4HBaH4QhF18RSKGOWwA/GDB-UI?type=design&node-id=111-1101&t=sDAc1dWc1LAfqpaT-0&scaling=min-zoom&page-id=0%3A1&starting-point-node-id=111%3A2956

You can also open an issue on the [GitHub repository](https://github.com/c2siorg/GDB-UI/issues).