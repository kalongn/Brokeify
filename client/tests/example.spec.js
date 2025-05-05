import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/tests/auth/auth.json' }); // applies to all tests below

test('testLogIn', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Google Icon Login with Google' }).click();
  await expect(page).toHaveURL('http://localhost:5173/Home');
});

test('goToProfilePage', async ({ page }) => {
  
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Google Icon Login with Google' }).click();
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'My Profile' }).click();
  await expect(page).toHaveURL('http://localhost:5173/Profile');
});

test('profileDataUpdated', async ({ page }) => {
  
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Google Icon Login with Google' }).click();
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'My Profile' }).click();
  await expect(page.getByRole('main')).toContainText('Brokeify Guest');
  await expect(page.getByRole('main')).toContainText('brokeify416@gmail.com');
  await page.getByText('brokeify416@gmail.com').click();
  await expect(page.getByText('brokeify416@gmail.com')).toBeVisible();
});
{/*
test('goToScenario', async ({ page }) => {
  
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Google Icon Login with Google' }).click();
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'My Scenarios' }).click();
  await page.getByRole('link', { name: 'Test Scenario Test Scenario' }).click();
  await page.getByRole('heading', { name: 'Test Scenario' }).click();
  await expect(page).toHaveURL('http://localhost:5173/Scenario/67e0dddfcc570acae9ce8b52');
});
*/}
