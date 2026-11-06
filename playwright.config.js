const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.js",
  timeout: 60000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:8765" },
  webServer: {
    command: "python3 -m http.server 8765 --bind 127.0.0.1",
    port: 8765,
    reuseExistingServer: true
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1180, height: 820 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1180, height: 820 } } }
  ]
});
