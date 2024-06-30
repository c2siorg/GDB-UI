import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    include: ["src/**/*.{test,spec}.{js,ts}"], // Moved out of the nested test object
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
