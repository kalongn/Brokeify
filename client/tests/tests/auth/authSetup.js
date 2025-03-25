import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Google Icon Login with Google' }).click();

    console.log('Log in manually, then press ENTER in the terminal.');
    await page.pause();  // Pause so you can log in manually

    await context.storageState({ path: 'tests/auth/auth.json' });
    console.log('✅ Authentication state saved!');

    await browser.close();
})();
