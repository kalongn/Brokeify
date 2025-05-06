import { test, expect } from '@playwright/test';
// Since completing the form requires sequential valid inputs for each section,
// valid input test cases are stored in variables for reuse across tests

const navigateToForm = async (page) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await expect(page).toHaveURL("http://localhost:5173/Home");
  await page.getByRole('link', { name: 'Create Scenario' }).click();
  await expect(page.getByTestId('heading').getByText('Basic Information')).toBeVisible();
}

// Testing Basic Info section
test('Basic Info: Invalid', async ({ page }) => {
  await navigateToForm(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('heading').getByText('Basic Information')).toBeVisible();
  await page.fill('[name="name"]', "test scenario");
  await page.fill('#financialGoal', "-333");
  await page.click('#state');
  await page.getByRole('option', { name: 'New York' }).click();
  await page.getByText('Married').click();
  await page.fill('#birthYear', "2026");
  await page.getByTestId('distributions-lifeExpectancy').getByRole('radio', { name: 'Fixed Value' }).check();
  await page.getByTestId('fixedInput').fill("1000");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('heading').getByText('Basic Information')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
});

const basicInfoValid = async (page) => {
  await expect(page.getByTestId('heading').getByText('Basic Information')).toBeVisible();
  await page.fill('[name="name"]', "test scenario");
  await page.fill('#financialGoal', "3330");
  await page.click('#state');
  await page.getByRole('option', { name: 'New York' }).click();
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
}

test('Basic Info: Valid & Persistent', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  // Persistence check
  await page.getByRole('button', { name: 'Back' }).click();
  // Prompt to AI (Amazon Q): How would I check the highlighted code has a certain value?
  // It gave the correct functions, and I filled them in
  await expect(page.locator('input[name="name"]')).toHaveValue('test scenario');
  await expect(page.locator('#financialGoal')).toHaveValue('3330');
  await expect(page.locator('#state')).toContainText('New York');
  await expect(page.getByText('Married')).toBeChecked();
  await expect(page.locator('#birthYear')).toHaveValue('2000');
  await expect(page.getByTestId('fixedInput')).toHaveValue('90');
  await expect(page.locator('#spouseBirthYear')).toHaveValue('1999');
  await expect(page.getByTestId('normalMean')).toHaveValue('88');
  await expect(page.getByTestId('normalStandardDeviation')).toHaveValue('8');
});

// Testing Investment Types section
test('Add Investment Types Invalid', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);

  await page.getByRole('button', { name: 'Add New Investment Type' }).click();
  await expect(page.getByText('New Investment Type')).toBeVisible();
  await page.fill('#investmentType', "Cash     ");
  await page.getByTestId('distributions-expectedAnnualReturn').getByRole('radio', { name: 'Fixed Value or Percentage' }).check();
  await page.getByTestId('fixedInput').fill("222");
  await page.getByTestId('distributions-expectedAnnualReturn').getByRole('checkbox', { name: 'Percentage' }).check();
  await page.fill('#expenseRatio', '101');
  await page.getByTestId('distributions-expectedDividendsInterest').getByRole('radio', { name: 'Sample from Normal Distribution' }).check();
  await page.getByTestId('normalMean').fill("101");
  await page.getByTestId('normalStandardDeviation').fill("0.5");
  await page.getByTestId('distributions-expectedDividendsInterest').getByRole('checkbox', { name: 'Percentage' }).check();
  await page.getByText('Tax-exempt').click();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('New Investment Type')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
});

const addInvestmentTypeValid = async (page, invName) => {
  await page.getByRole('button', { name: 'Add New Investment Type' }).click();
  await expect(page.getByText('New Investment Type')).toBeVisible();
  await page.fill('#investmentType', invName);
  await page.getByTestId('distributions-expectedAnnualReturn').getByRole('radio', { name: 'Fixed Value or Percentage' }).check();
  await page.getByTestId('fixedInput').fill("2");
  await page.getByTestId('distributions-expectedAnnualReturn').getByRole('checkbox', { name: 'Percentage' }).check();
  await page.fill('#expenseRatio', '0.2');
  await page.getByTestId('distributions-expectedDividendsInterest').getByRole('radio', { name: 'Sample from Normal Distribution' }).check();
  await page.getByTestId('normalMean').fill("2");
  await page.getByTestId('normalStandardDeviation').fill("0.5");
  await page.getByTestId('distributions-expectedDividendsInterest').getByRole('checkbox', { name: 'Percentage' }).check();
  await page.getByText('Tax-exempt').click();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(invName)).toBeVisible();
}

test('Add Investment Types Valid & Persistent', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentTypeValid(page, "Stocks");
});

test('Edit & Delete Investment Types', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentTypeValid(page, "Stocks");

  // Edit an investment
  await page.getByTestId('edit-Stocks').click();
  await expect(page.getByText('New Investment Type')).toBeVisible();
  await page.fill('#investmentType', "Hopeful Stocks");
  await page.getByTestId('distributions-expectedDividendsInterest').getByRole('radio', { name: 'Sample from Normal Distribution' }).check();
  await page.getByTestId('normalMean').fill("100");
  await page.getByTestId('normalStandardDeviation').fill("3");
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Hopeful Stocks')).toBeVisible();

  // Delete an investment
  // Prompt to AI (Amazon Q): How do i select yes in this alert popup?
  // Code snippet generated worked as expected
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByTestId('delete-Hopeful Stocks').click();
  await expect(page.getByText('Hopeful Stocks')).not.toBeVisible();
});

// Testing Investments section
test('Add & Delete Investments Invalid', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentTypeValid(page, "Stocks");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Add New Investment')).toBeVisible();

  const tableRows = page.locator('tr');
  
  // Create two rows with the same investment type and tax status
  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(3);
  const investmentRow1 = tableRows.nth(2);
  await investmentRow1.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Stocks' }).click();
  await investmentRow1.locator('[name="dollarValue"]').fill('100');
  await investmentRow1.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Non-Retirement' }).click();

  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(4);
  const investmentRow2 = tableRows.nth(3);
  await investmentRow2.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Stocks' }).click();
  await investmentRow2.locator('[name="dollarValue"]').fill('2090');
  
  await investmentRow2.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Non-Retirement' }).click();
  await page.getByRole('button', { name: 'Add New Investment' }).click();
  // Counting header row and Cash row(+2)
  await expect(tableRows).toHaveCount(5);

  // Triggers error because not all fields are filled
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Add New Investment')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
  // Delete unfilled row and trigger error for investments with the same type and tax status
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const investmentRow3 = tableRows.nth(4);
  await investmentRow3.getByTestId('deleteButton').click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Add New Investment')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
});

const addInvestmentsValid = async (page) => {
  await addInvestmentTypeValid(page, "Stocks");
  await addInvestmentTypeValid(page, "Bonds");
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(3000);
  await expect(page.getByText('Add New Investment')).toBeVisible();

  const tableRows = page.locator('tr');
  // Creating unique investments
  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(3);
  const investmentRow1 = tableRows.nth(2);
  await investmentRow1.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Stocks' }).click();
  await investmentRow1.locator('[name="dollarValue"]').fill('100');
  await investmentRow1.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Non-Retirement' }).click();

  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(4);
  const investmentRow2 = tableRows.nth(3);
  await investmentRow2.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Stocks' }).click();
  await investmentRow2.locator('[name="dollarValue"]').fill('90');
  await investmentRow2.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();

  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(5);
  const investmentRow3 = tableRows.nth(4);
  await investmentRow3.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Stocks' }).click();
  await investmentRow3.locator('[name="dollarValue"]').fill('80');
  await investmentRow3.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'After-Tax Retirement' }).click();

  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(6);
  const investmentRow4 = tableRows.nth(5);
  await investmentRow4.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Bonds' }).click();
  await investmentRow4.locator('[name="dollarValue"]').fill('900');
  await investmentRow4.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();

  await page.getByRole('button', { name: 'Add New Investment' }).click();
  await expect(tableRows).toHaveCount(7);
  const investmentRow5 = tableRows.nth(6);
  await investmentRow5.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Bonds' }).click();
  await investmentRow5.locator('[name="dollarValue"]').fill('800');
  await investmentRow5.locator('#selectTaxStatus').click()
  await page.getByRole('option', { name: 'After-Tax Retirement' }).click();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Add New Event Series')).toBeVisible();
}

test('Add Investments Valid & Persistent', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentsValid(page);
  // Persistence check
  await page.getByRole('button', { name: 'Back' }).click();
  const tableRows = page.locator('tr');
  await expect(tableRows).toHaveCount(7);
});

// Testing Event Series section
test('Add Event Series Invalid', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentsValid(page);
  await page.getByRole('button', { name: 'Add New Event Series' }).click();
  await expect(page.getByText('New Event Series')).toBeVisible();

  // General form fields
  await page.fill('[name="name"]', '   ');
  await page.getByTestId('distributions-startYear').getByRole('radio', { name: 'Sample from Uniform Distribution' }).check();
  await page.getByTestId('uniformLower').fill("23");
  await page.getByTestId('uniformUpper').fill("22");
  await page.getByTestId('distributions-duration').getByRole('radio', { name: 'Sample from Normal Distribution' }).check();
  await page.getByTestId('normalMean').fill("1000");
  await page.getByTestId('normalStandardDeviation').fill("995");
  await page.getByRole('radio', { name: 'Income' }).check();

  // Event-specific form fields
  await page.locator('[name="isSocialSecurity"]').check();
  await page.locator("#initialValue").fill("3232");
  await page.getByTestId('distributions-expectedAnnualChange').getByRole('radio', { name: 'Fixed Value or Percentage' }).check();
  await page.getByTestId('fixedInput').fill("210");
  await page.getByTestId('distributions-expectedAnnualChange').getByRole('checkbox', { name: 'Percentage' }).check();
  await page.locator("#percentageIncrease").fill("-0.32");
  await page.locator('[name="isAdjustInflation"]').check();

  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('New Event Series')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
});

const addEventSeriesValid = async (page) => {
  await page.getByRole('button', { name: 'Add New Event Series' }).click();
  await expect(page.getByText('New Event Series')).toBeVisible();
  // General form fields
  await page.fill('[name="name"]', 'Rebalancing Event');
  await page.getByTestId('distributions-startYear').getByRole('radio', { name: 'Sample from Uniform Distribution' }).check();
  await page.getByTestId('uniformLower').fill("2024");
  await page.getByTestId('uniformUpper').fill("2040");
  await page.getByTestId('distributions-duration').getByRole('radio', { name: 'Sample from Normal Distribution' }).check();
  await page.getByTestId('normalMean').fill("3");
  await page.getByTestId('normalStandardDeviation').fill("2");
  await page.getByText('Rebalance').click();

  // Event-specific form fields
  await page.getByText("Glide Path").click();
  await page.locator('#taxStatus').click()
  await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();

  await page.getByRole('button', { name: 'Add Investment' }).click();
  const tableRows = page.locator('tr');
  // Counting header row (+1)
  await expect(tableRows).toHaveCount(3);
  const investmentRow1 = tableRows.nth(1);
  const investmentRow2 = tableRows.nth(2);

  await investmentRow1.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Stocks' }).click();
  await investmentRow1.locator('input[placeholder="Initial %"]').fill('30');
  await investmentRow1.locator('input[placeholder="Final %"]').fill('90');

  await investmentRow2.locator('#selectInvestment').click()
  await page.getByRole('option', { name: 'Bonds' }).click();
  await investmentRow2.locator('input[placeholder="Initial %"]').fill('70');
  await investmentRow2.locator('input[placeholder="Final %"]').fill('10');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Add New Event Series')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
}

test('Add Event Series Valid & Persistent', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentsValid(page);
  await addEventSeriesValid(page);
  // Persistence check
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Rebalancing Event')).toBeVisible();
});

// Testing Limits section
test('Limits: Invalid', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentsValid(page);
  await addEventSeriesValid(page);
  await expect(page.getByTestId('heading').getByText('Inflation & Contribution Limits')).toBeVisible();
  await page.getByTestId('distributions-inflationAssumption').getByRole('radio', { name: 'Fixed Percentage' }).check();
  await page.getByTestId('fixedInput').fill("110");
  await page.locator('[name="initialLimit"]').fill("1000");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('heading').getByText('Inflation & Contribution Limits')).toBeVisible();
  await expect(page.getByTestId('errorMessage')).toBeInViewport();
});

const limitsValid = async (page) => {
  await expect(page.getByTestId('heading').getByText('Inflation & Contribution Limits')).toBeVisible();
  await page.getByTestId('distributions-inflationAssumption').getByRole('radio', { name: 'Fixed Percentage' }).check();
  await page.getByTestId('fixedInput').fill("32");
  await page.locator('[name="initialLimit"]').fill("1000");
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('heading').getByText('Spending Strategy')).toBeVisible();
}

test('Limits: Valid & Persistent', async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentsValid(page);
  await addEventSeriesValid(page);
  await limitsValid(page);

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('fixedInput')).toHaveValue('32');
  await expect(page.locator('[name="initialLimit"]')).toHaveValue('1000');
});

// Testing Roth Conversion Strategy & Optimizer
test("Roth: Valid", async ({ page }) => {
  await navigateToForm(page);
  await basicInfoValid(page);
  await addInvestmentsValid(page);
  await addEventSeriesValid(page);
  await limitsValid(page);

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('heading').getByText('Roth Conversion Strategy & Optimizer')).toBeVisible();
  await page.getByRole('button', { name: 'Save & Close' }).click({ force: true });
  await expect(page).toHaveURL("http://localhost:5173/Home");
});