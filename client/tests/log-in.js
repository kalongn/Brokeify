import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Google Icon Login with Google' }).click();
  await page.getByRole('textbox', { name: 'Email or phone' }).fill('brokeify416');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('cse416brokeify');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL("http://localhost:5173/Home");
  
});