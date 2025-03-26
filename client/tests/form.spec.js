import { test, expect } from '@playwright/test';

test('scenarioInvalidInputs', async ({ page }) => {
  await page.goto('http://localhost:5173/ScenarioForm/');
  await expect(page.getByText('Basic Information')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Basic Information')).toBeVisible();
  await page.fill('[name="name"]', "test scenario");
  await page.fill('[name="financialGoal"]', "-333");
  await page.click('#state');
  await page.getByRole('option', { name: 'New York' }).click();
  await page.locator('[name="maritalStatus"][value="single"]').check();
  await page.fill('[name="birthYear"]', "2026");
  await page.locator('[name="lifeExpectancy"][value="fixed"]').check();
  await page.waitForSelector('[name="lifeExpectancyFixed"]');
  await page.fill('[name="lifeExpectancyFixed"]', "10000");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Basic Information')).toBeVisible();
});

test("scenarioValidInputs",  async ({ page }) => {
  await page.goto('http://localhost:5173/ScenarioForm/limits');
  await expect(page.getByText('Inflation & Contribution Limits')).toBeVisible();
  await page.locator('[name="inflationAssumption"][value="normal"]').check();
  await page.waitForSelector('[name="inflationAssumptionMean"]');
  await page.waitForSelector('[name="inflationAssumptionStdDev"]');
  await page.fill('[name="inflationAssumptionMean"]', "40");
  await page.fill('[name="inflationAssumptionStdDev"]', "5");
  await page.fill('[name="initialLimit"]', "2000");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Spending Strategy')).toBeVisible();
});

test("scenarioNavigation",  async ({ page }) => {
  await page.goto('http://localhost:5173/ScenarioForm/limits');
  await expect(page.getByText('Inflation & Contribution Limits')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Event Series' }));
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Inflation & Contribution Limits')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Event Series' }));
  await page.getByRole('button', { name: 'Back' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Investments' }));
  await page.getByRole('button', { name: 'Back' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Investment Types' }));
  await page.getByRole('button', { name: 'Next' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Investments' }));
});

test('scenarioAddInvestment', async ({ page }) => {
  await page.goto('http://localhost:5173/ScenarioForm/investments');
  await page.click('#_addButton_175wl_1');
  const tableRows = page.locator('tr');
  await expect(tableRows).toHaveCount(3);
  const investmentRow1 = tableRows.nth(1);
  const investmentRow2 = tableRows.nth(2);
  await investmentRow1.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Cash' }).click();
  await investmentRow1.locator('[name="dollarValue"]').fill('100');
  await investmentRow1.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Non-Retirement' }).click();
  
  await investmentRow2.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Cash' }).click();
  await investmentRow2.locator('[name="dollarValue"]').fill('90');
  await page.getByRole('button', { name: 'Next' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Investments' }));
  await investmentRow2.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  expect(page.locator('#heading').getByRole({ hasText: 'Event Series' }));
});