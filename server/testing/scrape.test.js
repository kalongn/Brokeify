
import { test, expect } from '@playwright/test';
import { scrapeFederalIncomeTaxBrackets, scrapeStandardDeductions, fetchCapitalGainsData, fetchRMDTable } from '../computation/scraper.js';
import { connectToDatabase,closeDatabaseConnection } from './utils.js';

test.beforeAll(async () => {
    await connectToDatabase();
});
test.afterAll(async () => {
    await closeDatabaseConnection();
});

test('scrape federal income tax brackets', async () => {
    const {year, taxBrackets} = await scrapeFederalIncomeTaxBrackets();
    
    //check that there are 4 tables
    expect(taxBrackets.length).toBe(4);
    //check that rates are monotonically increasing
    for(const i in taxBrackets.length){
        for(const j in taxBrackets[i].length){
            if(j!==0){
                expect(taxBrackets[i][j].rate).toBeGreaterThanOrEqual(taxBrackets[i][j-1].rate);
            }
        }
    }
    //check that every high bound is greater than every low bound
    //check that the high bound of braxket x is 1 less than low bound of x+1 bracket
    for(const i in taxBrackets.length){
        for(const j in taxBrackets[i].length){
            
            expect(taxBrackets[i][j].highBound).toBeGreaterThanOrEqual(taxBrackets[i][j].lowBound);
            if(j!==0){
                expect(taxBrackets[i][j].lowBound).toBe(taxBrackets[i][j-1].highBound+1);
            }
        }
    }

    //check that the year is correct
    const expectYear = 2024; // This can be outdated, but we can check the year in the test
    expect(year).toBe(expectYear);
});

test('scrape standard deductions', async () => {
    const {year, standardDeductions} = await scrapeStandardDeductions();
    
    expect(standardDeductions.length).toBe(3);
    for(const i in standardDeductions.length){
        expect(standardDeductions[i]).toHaveProperty("filingStatus");
        expect(standardDeductions[i]).toHaveProperty("amount");
    }

    //check that the year is correct
    const expectYear = 2024; // This can be outdated, but we can check the year in the test
    expect(year).toBe(expectYear);
});

test('scrape federal capital gains', async () => {
    const res = await fetchCapitalGainsData();
    //check that there are 4 tables
    expect(res.length).toBe(4);
    //check that rates are monotonically increasing
    for(const i in res.length){
        for(const j in res[i].length){
            if(j!==0){
                expect(res[i][j].rate).toBeGreaterThanOrEqual(res[i][j-1].rate);
            }
        }
    }
    //check that every high bound is greater than every low bound
    //check that the high bound of braxket x is 1 less than low bound of x+1 bracket
    for(const i in res.length){
        for(const j in res[i].length){
            
            expect(res[i][j].highBound).toBeGreaterThanOrEqual(res[i][j].lowBound);
            if(j!==0){
                expect(res[i][j].lowBound).toBe(res[i][j-1].highBound+1);
            }
        }
    }
});

test('scrape rmd table', async () => {
    const res = await fetchRMDTable();
    expect(res).toHaveProperty("ages");
    expect(res).toHaveProperty("distributions");
    expect(res.ages.length).toEqual(res.distributions.length);
});