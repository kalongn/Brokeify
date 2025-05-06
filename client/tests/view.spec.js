import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await page.getByRole('link', { name: 'Create Scenario' }).click();
  await page.getByRole('textbox', { name: 'Scenario Name' }).click();
  await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
  await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
  await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('10000');
  await page.locator('#state svg').click();
  await page.locator('.css-19bb58m').click();
  await page.getByRole('combobox', { name: 'State of Residence Select...' }).fill('New ');
  await page.getByRole('option', { name: 'New York' }).click();
  await page.getByRole('radio', { name: 'Single' }).check();
  await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
  await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2004');
  await page.getByRole('radio', { name: 'Fixed Value' }).check();
  await page.getByTestId('fixedInput').click();
  await page.getByTestId('fixedInput').fill('90');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Investment Types' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Event Series' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Inflation & Contribution' })).toBeVisible();
  await page.getByRole('radio', { name: 'Fixed Percentage' }).check();
  await page.getByTestId('fixedInput').click();
  await page.getByTestId('fixedInput').fill('5');
  await page.getByRole('spinbutton', { name: 'After-Tax Retirement Accounts' }).click();
  await page.getByRole('spinbutton', { name: 'After-Tax Retirement Accounts' }).fill('10000');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Spending Strategy' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Expense Withdrawal Strategy' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Required Minimum Distribution' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Roth Conversion Strategy &' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & Close' }).click();
  await expect(page.getByRole('heading', { name: 'My Scenarios' })).toBeVisible();
});



test('Scenario Overview', async ({ page }) => {
  
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'Shared Scenarios' }).click();
  await page.getByRole('link', { name: 'My Scenarios' }).click();
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'Scenario 1 Scenario 1 SINGLE' }).click();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scenario 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scenario Overview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
});




test('View Scenario', async ({ page }) => {
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'Shared Scenarios' }).click();
  await page.getByRole('link', { name: 'My Scenarios' }).click();
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'Scenario 1 Scenario 1 SINGLE' }).click();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scenario 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scenario Overview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).first().click();
  await expect(page.getByRole('heading', { name: 'View Scenario' })).toBeVisible();
});
/*
test('View Scenario', async ({ page }) => {
  await page.getByRole('link', { name: 'Scenario 1 Scenario 1 SINGLE' }).click();
  await page.waitForTimeout(30000);
  await expect(page).toHaveURL("http://localhost:5173/Home");
  await page.getByRole('link').filter({ hasText: /^$/ }).first().click();
  await expect(page.locator('h1')).toContainText('View Scenario');
});

*/