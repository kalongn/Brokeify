//run via `npx playwright test`

import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './',
    use: {
        headless: true,
    },
});