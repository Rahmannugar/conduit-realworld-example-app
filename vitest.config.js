import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "backend",
          environment: "node",
          globals: true,
          globalSetup: "backend/test/globalSetup.js",
          setupFiles: "backend/test/setupEnv.js",
          include: ["backend/**/*.test.js"],
          fileParallelism: false,
        },
      },
      {
        plugins: [react()],
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: "frontend/src/setupTests.js",
          include: ["frontend/**/*.test.{js,jsx}"],
          css: true,
        },
      },
    ],
  },
});
