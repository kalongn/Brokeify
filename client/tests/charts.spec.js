import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  console.log('Before tests: created a scenario named Scenario 1');
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await page.goto("http://localhost:5173/Home");
 
});





test('Simulation Tab Navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Scenario Simulation');
  });

test("Invalid Number of Runs", async({page})=>{
    await page.goto("http://localhost:5173/Home");
    await page.getByRole('link', { name: 'Simulation' }).click();
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('55');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Please enter a number between 10 and 50.');
      
});


test('Simulation Successfully Run', async ({ page }) => {
  await page.goto('http://localhost:5173/Home');
  await page.getByRole('link', { name: 'Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('Scenario Simulation');
  await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
  await page.locator('#sim-count').click();
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  // Wait up to 90s for simulation to complete
  await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
});



test('Navigating to Charts Page', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Scenario Simulation');
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('40');
    await page.getByRole('button', { name: 'Run Simulation' }).click();

    
    //Wait up to 90s for simulation to complete
    await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });

    await page.getByRole('link', { name: 'See Results' }).click();
    await expect(page.getByRole('main')).toContainText('Add Charts');

  });

  
test('Add Charts Pop-Up', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Scenario Simulation');
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('40');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    //Wait up to 90s for simulation to complete
    await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
    await page.getByRole('link', { name: 'See Results' }).click();
    await expect(page.getByRole('main')).toContainText('Add Charts');
    await page.getByRole('button', { name: 'Add Charts' }).click();
    await expect(page.getByLabel('Modal')).toContainText('Line Chart');
    await expect(page.getByLabel('Modal')).toContainText('Shaded Line Chart');
    await expect(page.getByLabel('Modal')).toContainText('Stacked Bar Chart');

    await page.getByText('Line ChartProbability of').click();
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByRole('main')).toContainText('Line Chart');
});


test('Add Line Chart as Accordion', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Scenario Simulation');
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('40');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    //Wait up to 90s for simulation to complete
    await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
    await page.getByRole('link', { name: 'See Results' }).click();
    await expect(page.getByRole('main')).toContainText('Add Charts');
    await page.getByRole('button', { name: 'Add Charts' }).click();

    await page.getByText('Line ChartProbability of').click();
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByRole('main')).toContainText('Line Chart');
});


test('Shaded Line Chart - Error Validation', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Scenario Simulation');
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('40');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    //Wait up to 90s for simulation to complete
    await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
    await page.getByRole('link', { name: 'See Results' }).click();
    await expect(page.getByRole('main')).toContainText('Add Charts');
    await page.getByRole('button', { name: 'Add Charts' }).click();

    await page.getByText('Shaded Line ChartProbability').click();
    await page.getByRole('combobox').selectOption('Total Investments');
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByLabel('Modal')).toContainText('Please choose a dollar value (Today or Future).');
});





test('Stacked Bar Chart - Error Validation', async ({ page }) => {
    await page.goto('http://localhost:5173/Home');
    await page.getByRole('link', { name: 'Simulation' }).click();
    await expect(page.getByRole('main')).toContainText('Scenario Simulation');
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('40');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    //Wait up to 90s for simulation to complete
    await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
    await page.getByRole('link', { name: 'See Results' }).click();
    await page.getByRole('button', { name: 'Add Charts' }).click();
    await page.getByRole('heading', { name: 'Stacked Bar Chart' }).click();
    await page.getByRole('button', { name: 'Save & Add Chart' }).click();
    await expect(page.getByLabel('Modal')).toContainText('Please select Median or Average.');
    await expect(page.getByLabel('Modal')).toContainText('Please select a quantity.');
    await expect(page.getByLabel('Modal')).toContainText('Please enter an aggregation threshold.');
    await expect(page.getByLabel('Modal')).toContainText('Please choose a dollar value (Today or Future).');
  });

  test('Generate Chart', async ({ page }) => {
    await page.goto('http://localhost:5173/Simulation');
    await page.getByRole('combobox').selectOption('67f6e777015c679cd03c4638');
    await page.locator('#sim-count').click();
    await page.locator('#sim-count').fill('40');
    await page.getByRole('button', { name: 'Run Simulation' }).click();
    await page.getByRole('link', { name: 'See Results' }).click();
    await page.getByRole('button', { name: 'Generate Charts' }).click();
    await expect(page.getByRole('main')).toContainText('Line Chart');
    await expect(page.getByRole('main')).toContainText('Line Chart');
  });