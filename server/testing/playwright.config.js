//run via `npx playwright test`
import dotenv from 'dotenv';
dotenv.config();
import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './',
    use: {
        headless: true,
        DB_ADDRESS: process.env.DB_ADDRESS,
        FED_INCOME:process.env.FED_INCOME,
        FED_STANDARD_DEDUCTIONS:process.env.FED_STANDARD_DEDUCTIONS,
        FED_CAPITAL_GAINS:process.env.FED_CAPITAL_GAINS,
        FED_RMD:process.env.FED_RMD,
    },
});