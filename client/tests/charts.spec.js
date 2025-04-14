import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reusable constants
const baseURL = 'http://localhost:5173';
const scenarioId = '67f6e777015c679cd03c4638';

test.beforeEach(async ({ page }) => {
  console.log('Before tests: created a scenario named Scenario 1');
  await page.goto(`${baseURL}/`);
  await page.getByRole('link', { name: 'Continue as Guest' }).click();
  await page.goto(`${baseURL}/Home`);
});

test('Simulation Tab Navigation', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('Scenario Simulation');
});

test("Invalid Number of Runs", async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('55');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('Please enter a number between 10 and 50.');
});

test('Simulation Successfully Run', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('Scenario Simulation');
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
});

test('Navigating to Charts Page', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
  await page.getByRole('link', { name: 'See Results' }).click();
  await expect(page.getByRole('main')).toContainText('Add Charts');
});

test('Add Charts Pop-Up', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
  await page.getByRole('link', { name: 'See Results' }).click();
  await page.getByRole('button', { name: 'Add Charts' }).click();
  await expect(page.getByLabel('Modal')).toContainText('Line Chart');
  await page.getByText('Line ChartProbability of').click();
  await page.getByRole('button', { name: 'Save & Add Chart' }).click();
  await expect(page.getByRole('main')).toContainText('Line Chart');
});

test('Add Line Chart as Accordion', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
  await page.getByRole('link', { name: 'See Results' }).click();
  await page.getByRole('button', { name: 'Add Charts' }).click();
  await page.getByText('Line ChartProbability of').click();
  await page.getByRole('button', { name: 'Save & Add Chart' }).click();
  await expect(page.getByRole('main')).toContainText('Line Chart');
});

test('Shaded Line Chart - Error Validation', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await expect(page.getByRole('main')).toContainText('See Results', { timeout: 90_000 });
  await page.getByRole('link', { name: 'See Results' }).click();
  await page.getByRole('button', { name: 'Add Charts' }).click();
  await page.getByText('Shaded Line ChartProbability').click();
  await page.getByRole('combobox').selectOption('Total Investments');
  await page.getByRole('button', { name: 'Save & Add Chart' }).click();
  await expect(page.getByLabel('Modal')).toContainText('Please choose a dollar value (Today or Future).');
});

test('Stacked Bar Chart - Error Validation', async ({ page }) => {
  await page.getByRole('link', { name: 'Simulation' }).click();
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
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
  await page.goto(`${baseURL}/Simulation`);
  await page.getByRole('combobox').selectOption(scenarioId);
  await page.locator('#sim-count').fill('40');
  await page.getByRole('button', { name: 'Run Simulation' }).click();
  await page.getByRole('link', { name: 'See Results' }).click();
  await page.getByRole('button', { name: 'Generate Charts' }).click();
  await expect(page.getByRole('main')).toContainText('Line Chart');
});

// Coverage writing hook
test.afterEach(async ({ page }) => {
  const coverage = await page.evaluate(() => window.__coverage__);

  if (coverage) {
    const outputDir = path.resolve(__dirname, '../.nyc_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, `coverage-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(coverage));
    console.log(`✅ Coverage written to ${filePath}`);
  } else {
    console.warn('⚠️ window.__coverage__ is undefined (this test might not have hit any instrumented code)');
  }
});
