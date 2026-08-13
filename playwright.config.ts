import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;
const sessionSecret = process.env.SESSION_SECRET || 'fitcontrol-e2e-session-secret-32-characters-minimum';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // O catálogo importa centenas de demonstrações. Muitos workers forçam o
  // servidor de desenvolvimento a compilar várias rotas pesadas ao mesmo
  // tempo e tornam os testes locais intermitentes sem acelerar a suíte.
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ...process.env, SESSION_SECRET: sessionSecret },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  outputDir: 'test-results',
});
