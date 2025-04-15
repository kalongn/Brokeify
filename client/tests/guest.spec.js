import { test, expect } from '@playwright/test';

test('logInAsGuest', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await expect(page).toHaveURL("http://localhost:5173/Home");

});

test('logout test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await page.getByRole('link', { name: 'My Profile' }).click();
  await expect(page.getByRole('main')).toContainText('Guest Guest');
  await expect(page.getByRole('main')).toContainText('N/A');
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('#root')).toContainText('Your Future,');
  await expect(page.locator('#root')).toContainText('Your Plan,');
  await expect(page.locator('#root')).toContainText('Our Guidance');
});

test("Navigate to Create Scenario", async ({page}) =>{
    await page.goto('http://localhost:5173/');

    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    
    
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await expect(page.locator('[id="_heading_nmd6n_1"]')).toContainText('Basic Information');
});

test('Go to Shared Scenarios', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.getByRole('link', { name: 'Shared Scenarios' }).click();
    await expect(page.getByRole('paragraph')).toContainText('Whoops...you don\'t have access as a guest. Please consider making an account to share scenarios.');
  });



test("Check Persistence between Basic Info and Investment Page", async ({page}) =>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await expect(page.locator('[id="_heading_nmd6n_1"]')).toContainText('Basic Information');
    await page.getByRole('textbox', { name: 'Scenario Name' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('My Scenario ');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('100');
    await page.locator('.css-1xc3v61-indicatorContainer').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByRole('radio', { name: 'Fixed Value' }).check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('100');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Your Birth Year' })).toHaveValue('2000');
});


test("Creation of Investment Type", async({page})=>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).dblclick();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('200');
    await page.locator('.css-19bb58m').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByText('Fixed Value').click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('99');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment Type' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).fill('Stocks');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).first().check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('49');
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).click();
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).fill('2');
    await page.locator('div').filter({ hasText: /^Fixed Value or PercentageSample from Normal Distribution$/ }).getByLabel('Fixed Value or Percentage').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('1000');
    await page.getByText('Taxable').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
});


test("Persistence of Investment Type", async({page})=>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).dblclick();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('200');
    await page.locator('.css-19bb58m').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByText('Fixed Value').click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('99');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment Type' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).fill('Stocks');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).first().check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('49');
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).click();
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).fill('2');
    await page.locator('div').filter({ hasText: /^Fixed Value or PercentageSample from Normal Distribution$/ }).getByLabel('Fixed Value or Percentage').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('1000');
    await page.getByText('Taxable').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');



});


test("Add an Investment + Persistence", async({page})=>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).dblclick();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('200');
    await page.locator('.css-19bb58m').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByText('Fixed Value').click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('99');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment Type' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).fill('Stocks');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).first().check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('49');
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).click();
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).fill('2');
    await page.locator('div').filter({ hasText: /^Fixed Value or PercentageSample from Normal Distribution$/ }).getByLabel('Fixed Value or Percentage').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('1000');
    await page.getByText('Taxable').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.locator('.css-19bb58m').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('100');
    await page.locator('td:nth-child(3) > ._selectTable_nmd6n_207 > .css-13cymwt-control > .css-hlgwow > .css-19bb58m').click();
    await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.locator('tr:nth-child(3) > td > ._selectTable_nmd6n_207 > .css-13cymwt-control > .css-hlgwow').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('200');
    await page.locator('tr:nth-child(3) > td:nth-child(3) > ._selectTable_nmd6n_207 > .css-13cymwt-control > .css-hlgwow > .css-19bb58m').click();
    await page.getByRole('option', { name: 'Non-Retirement' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
});



test("Investment Persistence", async({page})=>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).dblclick();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('200');
    await page.locator('.css-19bb58m').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByText('Fixed Value').click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('99');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment Type' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).fill('Stocks');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).first().check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('49');
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).click();
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).fill('2');
    await page.locator('div').filter({ hasText: /^Fixed Value or PercentageSample from Normal Distribution$/ }).getByLabel('Fixed Value or Percentage').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('1000');
    await page.getByText('Taxable').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.getByRole('row', { name: 'Select... Select...' }).locator('svg').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('100');
    await page.locator('div').filter({ hasText: /^Select\.\.\.$/ }).nth(2).click();
    await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.locator('tr:nth-child(3) > td > ._selectTable_nmd6n_207 > .css-13cymwt-control > .css-hlgwow > .css-19bb58m').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('200');
    await page.getByRole('cell', { name: 'Select...' }).locator('svg').click();
    await page.getByRole('option', { name: 'After-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
});



test("New Event Creation + Persistence", async({page})=>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).dblclick();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('200');
    await page.locator('.css-19bb58m').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByText('Fixed Value').click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('99');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment Type' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).fill('Stocks');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).first().check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('49');
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).click();
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).fill('2');
    await page.locator('div').filter({ hasText: /^Fixed Value or PercentageSample from Normal Distribution$/ }).getByLabel('Fixed Value or Percentage').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('1000');
    await page.getByText('Taxable').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.getByRole('row', { name: 'Select... Select...' }).locator('svg').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('100');
    await page.locator('div').filter({ hasText: /^Select\.\.\.$/ }).nth(2).click();
    await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.locator('tr:nth-child(3) > td > ._selectTable_nmd6n_207 > .css-13cymwt-control > .css-hlgwow > .css-19bb58m').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('200');
    await page.getByRole('cell', { name: 'Select...' }).locator('svg').click();
    await page.getByRole('option', { name: 'After-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('tbody')).toContainText('Stocks');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Event Series' }).click();
    await page.getByRole('textbox', { name: 'Event Series Name' }).click();
    await page.getByRole('textbox', { name: 'Event Series Name' }).fill('Get a Pet');
    await page.locator('[id="_newItemContainer_nmd6n_1"] div').filter({ hasText: 'Fixed ValueSample from Uniform DistributionSample from Normal DistributionSame' }).getByLabel('Fixed Value').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('2025');
    await page.locator('div').filter({ hasText: /^Fixed ValueSample from Uniform DistributionSample from Normal Distribution$/ }).getByLabel('Fixed Value').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('3');
    await page.getByText('Expense').click();
    await page.getByRole('spinbutton', { name: 'Initial Value' }).click();
    await page.getByRole('spinbutton', { name: 'Initial Value' }).fill('12000');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).check();
    await page.locator('[id="_newItemContainer_nmd6n_1"] div').filter({ hasText: 'DiscretionaryInitial' }).getByLabel('Input Value').click();
    await page.locator('[id="_newItemContainer_nmd6n_1"] div').filter({ hasText: 'DiscretionaryInitial' }).getByLabel('Input Value').fill('3');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Get a Pet');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('tbody')).toContainText('Get a Pet');
});




{/*TODO: Michelle, I hand this off to you :) */}
test("Created Scenario", async({page})=>{
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Create Scenario' }).click();
    await page.getByRole('textbox', { name: 'Scenario Name' }).dblclick();
    await page.getByRole('textbox', { name: 'Scenario Name' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Scenario Name' }).fill('Scenario 1');
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).click();
    await page.getByRole('spinbutton', { name: 'Financial Goal Specify a non-' }).fill('200');
    await page.locator('.css-19bb58m').click();
    await page.getByRole('option', { name: 'Alabama' }).click();
    await page.getByText('Single').click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).click();
    await page.getByRole('spinbutton', { name: 'Your Birth Year' }).fill('2000');
    await page.getByText('Fixed Value').click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('99');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment Type' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).click();
    await page.getByRole('textbox', { name: 'Investment Type Name' }).fill('Stocks');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).first().check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('49');
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).click();
    await page.getByRole('spinbutton', { name: 'Expense Ratio' }).fill('2');
    await page.locator('div').filter({ hasText: /^Fixed Value or PercentageSample from Normal Distribution$/ }).getByLabel('Fixed Value or Percentage').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('1000');
    await page.getByText('Taxable').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.getByRole('row', { name: 'Select... Select...' }).locator('svg').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('100');
    await page.locator('div').filter({ hasText: /^Select\.\.\.$/ }).nth(2).click();
    await page.getByRole('option', { name: 'Pre-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Add New Investment' }).click();
    await page.locator('tr:nth-child(3) > td > ._selectTable_nmd6n_207 > .css-13cymwt-control > .css-hlgwow > .css-19bb58m').first().click();
    await page.getByRole('option', { name: 'Stocks' }).click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').click();
    await page.getByRole('row', { name: 'Stocks Select...' }).getByPlaceholder('$').fill('200');
    await page.getByRole('cell', { name: 'Select...' }).locator('svg').click();
    await page.getByRole('option', { name: 'After-Tax Retirement' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Add New Event Series' }).click();
    await page.getByRole('textbox', { name: 'Event Series Name' }).click();
    await page.getByRole('textbox', { name: 'Event Series Name' }).fill('Get a Pet');
    await page.locator('[id="_newItemContainer_nmd6n_1"] div').filter({ hasText: 'Fixed ValueSample from Uniform DistributionSample from Normal DistributionSame' }).getByLabel('Fixed Value').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('2025');
    await page.locator('div').filter({ hasText: /^Fixed ValueSample from Uniform DistributionSample from Normal Distribution$/ }).getByLabel('Fixed Value').check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).nth(1).fill('3');
    await page.getByText('Expense').click();
    await page.getByRole('spinbutton', { name: 'Initial Value' }).click();
    await page.getByRole('spinbutton', { name: 'Initial Value' }).fill('12000');
    await page.getByRole('radio', { name: 'Fixed Value or Percentage' }).check();
    await page.locator('[id="_newItemContainer_nmd6n_1"] div').filter({ hasText: 'DiscretionaryInitial' }).getByLabel('Input Value').click();
    await page.locator('[id="_newItemContainer_nmd6n_1"] div').filter({ hasText: 'DiscretionaryInitial' }).getByLabel('Input Value').fill('3');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('Get a Pet');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('[id="_heading_nmd6n_1"]')).toContainText('Inflation & Contribution Limits');
    await page.getByRole('radio', { name: 'Fixed Percentage' }).check();
    await page.getByRole('spinbutton', { name: 'Input Value' }).click();
    await page.getByRole('spinbutton', { name: 'Input Value' }).fill('5');
    await page.getByRole('spinbutton', { name: 'After-Tax Retirement Accounts' }).click();
    await page.getByRole('spinbutton', { name: 'After-Tax Retirement Accounts' }).fill('100');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Save & Close' }).click();
});

