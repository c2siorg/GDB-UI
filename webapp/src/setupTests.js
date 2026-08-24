// Import jest-dom to extend Jest with custom matchers for DOM node assertions
import "@testing-library/jest-dom";

// jsdom does not implement scrollIntoView; components that auto-scroll log
// panels (e.g. Demo.jsx) call it in effects, so stub it to a no-op.
Element.prototype.scrollIntoView = () => {};

// Optional: Configure or set up global settings if needed

// For example, you might want to configure a mock server or add global variables.
// If you're using MSW (Mock Service Worker) for API mocking, you can set it up here:

// import { server } from './mocks/server';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
