import { test, expect } from '@playwright/test';
// Since completing the form requires sequential valid inputs for each section,
// valid input test cases are stored in variables for reuse across tests

const navigateToForm = async (page) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await expect(page).toHaveURL("http://localhost:5173/Home");
  await page.getByRole('link', { name: 'Create Scenario' }).click();
  await expect(page.getByText('Basic Information')).toBeVisible();
}

test('Basic Info Invalid Inputs', async ({ page }) => {
  await navigateToForm(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Basic Information')).toBeVisible();
  await page.fill('[name="name"]', "test scenario");
  await page.fill('#financialGoal', "-333");
  await page.click('#state');
  await page.getByRole('option', { name: 'New York' }).click();
  await page.getByText('Married').click();
  await page.fill('#birthYear', "2026");
  await page.getByTestId('distributions-lifeExpectancy').getByRole('radio', { name: 'Fixed Value' }).check();
  await page.getByTestId('fixedInput').fill("1000");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Basic Information')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
});

test('Basic Info Valid Inputs & Persistence',  async ({ page }) => {
  await navigateToForm(page);

  await expect(page.getByText('Basic Information')).toBeVisible();
  await page.fill('[name="name"]', "test scenario");
  await page.fill('#financialGoal', "3330");
  await page.click('#state');
  await page.getByRole('option', { name: 'Wyoming' }).click();
  await page.getByText('Married').click();
  await page.fill('#birthYear', "2000");
  await page.getByTestId('distributions-lifeExpectancy').getByRole('radio', { name: 'Fixed Value' }).check();
  await page.getByTestId('fixedInput').fill("90");
  await page.fill('#spouseBirthYear', "1999");
  await page.getByTestId('distributions-spouseLifeExpectancy').getByRole('radio', { name: 'Sample from Normal Distribution' }).check();
  await page.getByTestId('normalMean').fill("88");
  await page.getByTestId('normalStandardDeviation').fill("8");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Add New Investment Type' })).toBeVisible();
  // Persistence check
  await page.getByRole('button', { name: 'Back' }).click();
  // Prompt to AI (Amazon Q): How would I check the highlighted code has a certain value?
  // It gave the correct functions, and I filled them in
  await expect(page.locator('input[name="name"]')).toHaveValue('test scenario');
  await expect(page.locator('#financialGoal')).toHaveValue('3330');
  await expect(page.locator('#state')).toContainText('Wyoming');
  await expect(page.getByText('Married')).toBeChecked();
  await expect(page.locator('#birthYear')).toHaveValue('2000');
  await expect(page.getByTestId('fixedInput')).toHaveValue('90');
  await expect(page.locator('#spouseBirthYear')).toHaveValue('1999');
  await expect(page.getByTestId('normalMean')).toHaveValue('88');
  await expect(page.getByTestId('normalStandardDeviation')).toHaveValue('8');

  await page.getByRole('button', { name: 'Next' }).click();
});

// test("scenarioNavigation",  async ({ page }) => {
//   await page.goto('http://localhost:5173/ScenarioForm/limits');
//   await expect(page.getByText('Inflation & Contribution Limits')).toBeVisible();
//   await page.getByRole('button', { name: 'Back' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Event Series' }));
//   await page.getByRole('button', { name: 'Next' }).click();
//   await expect(page.getByText('Inflation & Contribution Limits')).toBeVisible();
//   await page.getByRole('button', { name: 'Back' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Event Series' }));
//   await page.getByRole('button', { name: 'Back' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Investments' }));
//   await page.getByRole('button', { name: 'Back' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Investment Types' }));
//   await page.getByRole('button', { name: 'Next' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Investments' }));
// });

// test('scenarioAddInvestment', async ({ page }) => {
//   await page.goto('http://localhost:5173/ScenarioForm/investments');
//   await page.click('#_addButton_175wl_1');
//   const tableRows = page.locator('tr');
//   await expect(tableRows).toHaveCount(3);
//   const investmentRow1 = tableRows.nth(1);
//   const investmentRow2 = tableRows.nth(2);
//   await investmentRow1.locator('#selectInvestment').click()
//   await page.getByRole('option', { name: 'Cash' }).click();
//   await investmentRow1.locator('[name="dollarValue"]').fill('100');
//   await investmentRow1.locator('#selectTaxStatus').click()
//   await page.getByRole('option', { name: 'Non-Retirement' }).click();
  
//   await investmentRow2.locator('#selectInvestment').click()
//   await page.getByRole('option', { name: 'Cash' }).click();
//   await investmentRow2.locator('[name="dollarValue"]').fill('90');
//   await page.getByRole('button', { name: 'Next' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Investments' }));
//   await investmentRow2.locator('#selectTaxStatus').click()
//   await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();
//   await page.getByRole('button', { name: 'Next' }).click();
//   expect(page.locator('#heading').getByRole({ hasText: 'Event Series' }));
// });