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

test('Go to Simulation Page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Scenarios' })).toBeVisible();
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario Simulation' })).toBeVisible();
});



test('Read Disclaimer', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Scenarios' })).toBeVisible();
    await page.getByRole('link', { name: 'Simulation' }).click();
    await page.locator('summary').click();
    await expect(page.getByText('The system expects the')).toBeVisible();

});


test('Invalid Number of Runs', async ({ page }) => {
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.locator('[id="_content_1sqkt_1"] svg').click();
  await page.getByRole('option', { name: 'Scenario 1 | created at 5/5/' }).click();
  await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).click();
  await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).press('Enter');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByTestId('errorMessage')).toBeVisible();
});



test('Successful Scenario Run - Charts Navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario Simulation' })).toBeVisible();
    await page.locator('[id="_content_1sqkt_1"] svg').click();
    await page.getByRole('option', { name: 'Scenario 1 | created at 5/5/' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).fill('15');
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).press('Enter');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await expect(page.getByRole('link', { name: 'See Normal Results' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('link', { name: 'See Normal Results' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario 1 Result' })).toBeVisible();
  });


  
test('Successful Scenario Run - Charts Pop-Up', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario Simulation' })).toBeVisible();
    await page.locator('[id="_content_1sqkt_1"] svg').click();
    await page.getByRole('option', { name: 'Scenario 1 | created at 5/5/' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).fill('15');
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).press('Enter');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await expect(page.getByRole('link', { name: 'See Normal Results' })).toBeVisible({ timeout: 120000 });
    await page.getByRole('link', { name: 'See Normal Results' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario 1 Result' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('button', { name: 'Add Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Select a Chart' })).toBeVisible();
  });


  
test('Add Line Chart', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario Simulation' })).toBeVisible();
    await page.locator('[id="_content_1sqkt_1"] svg').click();
    await page.getByRole('option', { name: 'Scenario 1 | created at 5/5/' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).fill('15');
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).press('Enter');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await expect(page.getByRole('link', { name: 'See Normal Results' })).toBeVisible({ timeout: 120000 });
    await page.getByRole('link', { name: 'See Normal Results' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario 1 Result' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('button', { name: 'Add Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Select a Chart' })).toBeVisible();
    await page.getByText('Line ChartProbability of').click();
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByRole('heading', { name: 'Line Chart' })).toBeVisible();
  });


  

  
test('Add Shaded Line Chart', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario Simulation' })).toBeVisible();
    await page.locator('[id="_content_1sqkt_1"] svg').click();
    await page.getByRole('option', { name: 'Scenario 1 | created at 5/5/' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).fill('15');
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).press('Enter');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await expect(page.getByRole('link', { name: 'See Normal Results' })).toBeVisible({ timeout: 120000 });
    await page.getByRole('link', { name: 'See Normal Results' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario 1 Result' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('button', { name: 'Add Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Shaded Line Chart' })).toBeVisible();
    await page.getByText('Shaded Line ChartProbability').click();
    await page.getByLabel('Modal').locator('div').filter({ hasText: 'Line ChartProbability of Success over TimeShaded Line ChartProbability Ranges' }).locator('svg').click();
    await page.getByRole('option', { name: 'Total Investments' }).click();
    await page.getByRole('radio', { name: 'Today' }).check();
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByRole('heading', { name: 'Shaded Line Chart' })).toBeVisible();
  });



  
test('Add Stacked Bar Chart', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario Simulation' })).toBeVisible();
    await page.locator('[id="_content_1sqkt_1"] svg').click();
    await page.getByRole('option', { name: 'Scenario 1 | created at 5/5/' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).click();
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).fill('15');
    await page.getByRole('spinbutton', { name: 'Number of Simulation Runs' }).press('Enter');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await expect(page.getByRole('link', { name: 'See Normal Results' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('link', { name: 'See Normal Results' }).click();
    await expect(page.getByRole('heading', { name: 'Scenario 1 Result' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('button', { name: 'Add Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Stacked Bar Chart' })).toBeVisible();
    await page.getByText('Stacked Bar ChartMedian or').click();
    await page.getByText('Median', { exact: true }).click();
    await page.getByRole('radio').first().check();
    await page.getByLabel('Modal').locator('div').filter({ hasText: 'Line ChartProbability of Success over TimeShaded Line ChartProbability Ranges' }).locator('svg').click();
    await page.getByRole('option', { name: 'Investments Breakdown' }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('0');
    await page.getByRole('spinbutton').press('Enter');
    await page.getByRole('paragraph').filter({ hasText: 'Today' }).getByRole('radio').check();
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByRole('heading', { name: 'Stacked Bar Chart' })).toBeVisible();
  });

