import { test, expect } from '@playwright/test';

test('testLogIn', async ({ page }) => {
  await page.goto('http://localhost:5173/Home');
  await expect(page).toHaveURL('http://localhost:5173/Home');
});


test('goToProfilePage', async ({ page }) => {
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'My Profile' }).click();
  await page.getByText('brokeify416@gmail.com').click();
  await expect(page.getByText('Brokeify Doe')).toBeVisible();
  await page.getByText('brokeify416@gmail.com').click();
  await expect(page.getByText('brokeify416@gmail.com')).toBeVi

});
