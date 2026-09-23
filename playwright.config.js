import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3000);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm run dev -w backend",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://localhost:3001/api/tags",
    },
    {
      command: `npm run dev -w frontend -- --port ${PORT} --strictPort`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: `http://localhost:${PORT}`,
    },
  ],
});
