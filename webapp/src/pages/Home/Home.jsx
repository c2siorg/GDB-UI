import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to GDB-UI</h1>
      <p className="home-overview">
        GDB-UI is a user-friendly interface built for the GNU Debugger (GDB). 
        It provides a modern web-based UI for debugging applications, allowing developers to monitor program execution, inspect variables, set breakpoints, and more through an intuitive interface. 
        GDB-UI simplifies the debugging process by integrating powerful GDB features with a sleek design, making it particularly useful for developers working with languages like C, C++, and Ada. 
        This interface offers a more accessible and visual approach to debugging, facilitating easier identification and resolution of code issues.
      </p>
      <Link to="/debug" className="start-debugging-button">Start Debugging</Link>
    </div>
  );
}

export default Home;