import seedrandom from 'seedrandom';
import mongoose from "mongoose";
import { cursorTo } from 'readline';
import { investmentTypeFactory,
        investmentFactory,
        eventFactory,
        scenarioFactory,
        taxFactory,
        simulationFactory,
        distributionFactory,
        resultFactory,
} from './simulationHelper.js';
import { updateCSV, updateLog } from './logHelpers.js';
import { sample } from './sample.js';
import { logFile, csvFile } from '../simulator.js';
import { invMap } from './simulationHelper.js';

export function calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction, curYearIncome, curYearSS, earlyWithdrawalAmount, lastYearGains, currentYear) {
    //given info, comes up with a single number
    let totalTax = 0;
    //The IRS imposes a 10% penalty on the portion of the distribution that's 
    // included in your gross income, in addition to the regular income tax owed on that amount
    totalTax += .1 * earlyWithdrawalAmount;
    let eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(totalTax * 100) / 100} in early withdrawl tax.\n`;
    updateLog(eventDetails);
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS - federalStandardDeduction;
    const curYearStateTaxableIncome = curYearIncome - curYearSS; //41 states do not tax SS income
    //calculate fed income taxes
    let fedIncomeTax = 0;
    for (const bracketIndex in federalIncomeTax.taxBrackets) {
        const bracket = federalIncomeTax.taxBrackets[bracketIndex];
        

        if (bracket.lowerBound > curYearFedTaxableIncome) {
            break;
        }
        else {
            if (bracket.upperBound < curYearFedTaxableIncome&& bracket.upperBound!==0) {

                fedIncomeTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
                
            }
            else {
                
                fedIncomeTax += (curYearFedTaxableIncome - bracket.lowerBound) * bracket.rate;
                
                break;
            }
        }
    }
    
    eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(fedIncomeTax * 100) / 100} in federal income tax.\n`;
    updateLog(eventDetails);
    totalTax += fedIncomeTax;

    let sIncomeTax = 0;
    //calculate state income taxes:
    for (const bracketIndex in stateIncomeTax.taxBrackets) {
        const bracket = stateIncomeTax.taxBrackets[bracketIndex];
        if (bracket.lowerBound > curYearStateTaxableIncome) {
            break;
        }
        else {
            if (bracket.upperBound < curYearStateTaxableIncome && bracket.upperBound!==0) {

                sIncomeTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else {
                sIncomeTax += (curYearStateTaxableIncome - bracket.lowerBound) * bracket.rate;
                break;
            }
        }
    }
    totalTax += sIncomeTax;
    eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(sIncomeTax * 100) / 100} in state income tax.\n`;
    updateLog(eventDetails);
    //calculate capital gains taxes
    let capitalTax = 0;
    for (const bracketIndex in capitalGainTax.taxBrackets) {
        const bracket = capitalGainTax.taxBrackets[bracketIndex];
        if (bracket.lowerBound > lastYearGains) {
            break;
        }
        else {
            if (bracket.upperBound < lastYearGains&& bracket.upperBound!==0) {

                capitalTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else {
                capitalTax += (lastYearGains - bracket.lowerBound) * bracket.rate;
            }
        }
    }
    eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(capitalTax * 100) / 100} in capital gains tax.\n`;
    updateLog(eventDetails);
    totalTax += capitalTax;
    totalTax = Math.round((totalTax)*100)/100;
    earlyWithdrawalAmount = Math.round((earlyWithdrawalAmount)*100)/100;
    
    return { t: totalTax, e: .1 * earlyWithdrawalAmount };
}