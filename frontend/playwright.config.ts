import { defineConfig, devices } from '@playwright/test';

// Sobe o Vite em modo API real (VITE_USE_MOCK=false) para o teste exercitar
// o backend com os dados do seed massivo. O backend (API em :3333 + Postgres)
// deve estar em execução antes de rodar `npm run test:e2e`.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'VITE_USE_MOCK=false npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
