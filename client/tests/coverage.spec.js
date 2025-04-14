import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('should collect frontend coverage', async ({ page }) => {
  // Start Playwright test and run your app
  await page.goto('http://localhost:3000');

  // Extract coverage after tests
  const coverage = await page.evaluate(() => window.__coverage__);

  if (coverage) {
    // Create output directory if it doesn't exist
    fs.mkdirSync('./.nyc_output', { recursive: true });

    // Save the coverage data
    fs.writeFileSync(
      path.join('./.nyc_output', `coverage-${Date.now()}.json`),
      JSON.stringify(coverage)
    );
  }
});
