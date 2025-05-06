import { test, expect } from '@playwright/test';

test('logInAsGuest', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await expect(page).toHaveURL("http://localhost:5173/Home");

});


test('Test Sharing as Guest', async ({ page }) => {
    await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await expect(page).toHaveURL("http://localhost:5173/Home");
  await page.getByRole('link', { name: 'Shared Scenarios' }).click();
  await expect(page.getByText('Whoops...you don\'t have')).toBeVisible();
  await page.getByRole('heading', { name: 'Shared Scenarios' }).click();
  await expect(page.getByRole('heading', { name: 'Shared Scenarios' })).toBeVisible();
});

test('Test Import Scenario Modal', async ({ page }) => {
    await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await page.goto('http://localhost:5173/Home');
  await expect(page.getByRole('button', { name: 'Import Scenario' })).toBeVisible();
  await page.getByRole('button', { name: 'Import Scenario' }).click();
  await expect(page.getByRole('heading', { name: 'Import Scenario' })).toBeVisible();
});


test('Test Tax Import', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('heading', { name: 'Brokeify' }).click();
    await expect(page.getByRole('link', { name: 'My Profile' })).toBeVisible();
    await page.getByRole('link', { name: 'My Profile' }).click();
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'File Upload' })).toBeVisible();
    await page.getByRole('button', { name: 'Upload YAML' }).click();
    await expect(page.getByRole('heading', { name: 'Upload State Taxes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible();
    await page.locator('[id="_closeModalIcon_1ycgb_1"]').click();
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
    await expect(page.getByTestId('heading')).toBeVisible();
});

test('Go to Shared Scenarios', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByRole('link', { name: 'Continue as Guest' }).click();
    await page.goto('http://localhost:5173/Home');
    await page.goto('http://localhost:5173/SharedScenarios');
    await expect(page.getByRole('heading', { name: 'Shared Scenarios' })).toBeVisible();
  });



test("Check Persistence between Basic Info and Investment Page", async ({page}) =>{
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
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Your Birth Year' })).toHaveValue('2004');
});


