const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir:  './tests',
  timeout:  60000,       // 60s per test — accounts for slow API calls
  retries:  2,           // retry twice before marking failed
  workers:  1,           // sequential — avoids auth state conflicts
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:           'http://localhost:3000',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'retain-on-failure',
    actionTimeout:     15000,    // 15s to find/click elements
    navigationTimeout: 30000,    // 30s for page navigation
  },

  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome',  use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command:             'npm start',
    url:                 'http://localhost:3000',
    reuseExistingServer: true,
    timeout:             60000,
  },
});
