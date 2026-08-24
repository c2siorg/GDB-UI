import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    include: ["src/**/*.{test,spec}.{jsx,ts}"], // Moved out of the nested test object
    coverage: {
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        branches: 80,
        lines: 80,
        functions: 75,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
