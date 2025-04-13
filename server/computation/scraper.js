import axios from "axios";
import * as cheerio from 'cheerio';
import 'dotenv/config'

//This scaper is not flexible: it may only be re-used in the case of a change of values
//Any change in the structure of the relevant tables/fields will result in a fatal error

export async function scrapeFederalIncomeTaxBrackets() {
    try {
        const url = `${process.env.FED_INCOME}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const taxBrackets = [];
        const single = [];
        const marriedJoint = [];
        const marriedSeperate = [];
        const headOfHousehold = [];

        let year = null;
        $('h2').each((i, element) => {
            const text = $(element).text();
            const match = text.match(/(\d{4}) tax rates for a single taxpayer/i) || text.match(/(\d{4}) tax rates for other filers/i);
            if (match) {
                year = match[1];
                return false; // Stop loop once found
            }
        });

        if (!year) {
            console.log('Tax Year not found, default to current Year');
            year = new Date().getFullYear(); // Default to current year if not found
        } else {
            year = Number(year); // Convert to number
        }

        //This page has 4 tables:
        //Single
        //Married filing jointly
        //Mailied filing seperatley
        //Head of household
        let i = 0;
        $('table tbody tr').each((index, element) => {
            const tds = $(element).find('td');
            //hb is 'high bound' and is like this due to it sometimes being infinity
            //the regex takes in a tring and drops all characters exept 0-9, '0' and '.'
            //causing '$123,456.78' => '123456.78'
            let hb = Number($(tds[2]).text().trim().replace(/[^0-9.-]+/g, ""));
            if (hb == 0) { hb = Infinity; }
            const bracket = {
                rate: Number($(tds[0]).text().trim().replace(/[^0-9.-]+/g, "")),
                lowBound: Number($(tds[1]).text().trim().replace(/[^0-9.-]+/g, "")),
                highBound: hb
            };
            if (bracket.rate == '') {
                i++;    //increment's because rate will only be empty on header of table
            }
            else {
                if (i == 0) {
                    single.push(bracket);
                }
                if (i == 1) {
                    marriedJoint.push(bracket);
                }
                if (i == 2) {
                    marriedSeperate.push(bracket);
                }
                if (i == 3) {
                    headOfHousehold.push(bracket);
                }
            }

        });

        taxBrackets.push(single);
        taxBrackets.push(marriedJoint);
        taxBrackets.push(marriedSeperate);
        taxBrackets.push(headOfHousehold);


        return {year: year, taxBrackets: taxBrackets};
    } catch (error) {
        console.error('Error fetching tax brackets:', error);
        return [];
    }
}
//For testing: can do node scraper.js
//scrapeFederalIncomeTaxBrackets().then(brackets => console.log(brackets));

export async function scrapeStandardDeductions() {
    try {
        const url = `${process.env.FED_STANDARD_DEDUCTIONS}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);


        let year = null;
        $('h1').each((i, element) => {
            const text = $(element).text();
            const match = text.match(/Publication 17 \((\d{4})\), Your Federal Income Tax/i);
            if (match) {
                year = match[1];
                return false; // Stop loop once found
            }
        });

        if (!year) {
            console.log('Tax Year not found, default to current Year');
            year = new Date().getFullYear(); // Default to current year if not found
        } else {
            year = Number(year); // Convert to number
        }

        let standardDeductions = [];

        //hardcode the id (hope the irs doesnt update the website)
        const section = $(`#idm140408599383584`);
        if (!section.length) {
            console.error('Section not found.');
            return [];
        }

        //second table inside this section
        const table = section.find('table').eq(1);
        if (!table.length) {
            console.error('Table not found inside the section.');
            return [];
        }

        //data from the table
        table.find('tbody tr').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length >= 2 && i > 0) {
                const bracket = {
                    filingStatus: $(columns[0]).text().trim(),
                    amount: Number($(columns[1]).text().trim().replace(/[^0-9.-]+/g, "")),
                };
                standardDeductions.push(bracket);
            }
        });

        return {year: year, standardDeductions: standardDeductions};
    }
    catch (error) {
        console.error('Error fetching standard deductions:', error);
        return [];
    }
}

//test usage
//scrapeStandardDeductions().then(deductions => console.log(deductions));

export async function fetchCapitalGainsData() {
    try {
        const url = `${process.env.FED_CAPITAL_GAINS}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let unparsedBullets1 = [];
        let unparsedBullets2 = [];

        //<h2> with "Capital gains tax rates"
        const section = $('h2:contains("Capital gains tax rates")');

        if (!section.length) {
            console.error('Section not found.');
            return [];
        }

        //find the <ul>s that appears after the <h2>
        const bulletList = section.nextAll('ul').first();
        if (!bulletList.length) {
            console.error('No bullet points found under "Capital gains tax rates".');
            return [];
        }
        bulletList.find('li').each((index, element) => {
            unparsedBullets1.push($(element).text().trim());
        });

        const bulletList2 = section.nextAll('ul').eq(1);
        if (!bulletList2.length) {
            console.error('No bullet points found under "Capital gains tax rates".');
            return [];
        }
        bulletList2.find('li').each((index, element) => {
            unparsedBullets2.push($(element).text().trim());
        });


        let rate1, rate2, rate3;    //only 3 rates for capitol gains taxes, parse from site

        const firstParagraph = section.nextAll('p').first();
        if (!firstParagraph.length) {
            console.error('No paragraph found after "Capital gains tax rates".');
            return null;
        }
        const paragraphText1 = firstParagraph.text().trim();
        const numbers1 = paragraphText1.match(/\d+(\.\d+)?/g); //integers and decimals
        if (!numbers1 || numbers1.length === 0) {
            console.error('No numbers found in the first paragraph.');
            return null;
        }
        rate1 = Number(numbers1[numbers1.length - 1]);

        const secondParagraph = section.nextAll('p').eq(1);
        if (!secondParagraph.length) {
            console.error('No paragraph found after "Capital gains tax rates".');
            return null;
        }
        const paragraphText2 = secondParagraph.text().trim();
        const numbers2 = paragraphText2.match(/\d+(\.\d+)?/g); //integers and decimals
        if (!numbers2 || numbers2.length === 0) {
            console.error('No numbers found in the first paragraph.');
            return null;
        }
        rate2 = Number(numbers2[numbers2.length - 1]);

        const thirdParagraph = section.nextAll('p').eq(2);
        if (!thirdParagraph.length) {
            console.error('No paragraph found after "Capital gains tax rates".');
            return null;
        }
        const paragraphText3 = thirdParagraph.text().trim();
        const numbers3 = paragraphText3.match(/\d+(\.\d+)?/g); //integers and decimals
        if (!numbers3 || numbers3.length === 0) {
            console.error('No numbers found in the first paragraph.');
            return null;
        }
        rate3 = Number(numbers3[0]);


        //now, parse all data together and return


        let bracketValues = [];
        let q = 0;
        //let rx = /(?:^|\s)($[a-z0-9]\w*)/gi;
        unparsedBullets1.forEach((val) => {
            let s = val.split(" ");
            let v = [];
            for (let i = 0; i < s.length; i++) {
                v.push(s[i]);
            }
            for (let i = 0; i < v.length; i++) {
                //check if the start of each word is '$'
                if (v[i].charAt(0) == '$') {
                    bracketValues[q] = Number(v[i].replace(/[^0-9.-]+/g, ""));
                    q++;
                }
            }

        });
        unparsedBullets2.forEach((val) => {
            let s = val.split(" ");
            let v = [];
            for (let i = 0; i < s.length; i++) {
                v.push(s[i]);
            }
            for (let i = 0; i < v.length; i++) {
                //check if the start of each word is '$'
                if (v[i].charAt(0) == '$') {
                    bracketValues[q] = Number(v[i].replace(/[^0-9.-]+/g, ""));
                    q++;
                }
            }
        });
        //create brackets:
        //[
        // {rate: 'x', lowBound: 'y', highBound: 'z'}
        // {rate: 'x', lowBound: 'y', highBound: 'z'}
        //]
        const single = [];
        const marriedSeperate = [];
        const marriedJoint = [];
        const headOfHousehold = [];
        const taxBrackets = [];
        //single:
        const singleBracket1 = { rate: rate1, lowBound: 0, highBound: bracketValues[0] };
        const singleBracket2 = { rate: rate2, lowBound: bracketValues[0] + 1, highBound: bracketValues[4] };
        const singleBracket3 = { rate: rate3, lowBound: bracketValues[4] + 1, highBound: Infinity };
        single.push(singleBracket1);
        single.push(singleBracket2);
        single.push(singleBracket3);
        taxBrackets.push(single);

        //married joint:
        const marriedJointBracket1 = { rate: rate1, lowBound: 0, highBound: bracketValues[1] };
        const marriedJointBracket2 = { rate: rate2, lowBound: bracketValues[1] + 1, highBound: bracketValues[8] };
        const marriedJointBracket3 = { rate: rate3, lowBound: bracketValues[8] + 1, highBound: Infinity };
        marriedJoint.push(marriedJointBracket1);
        marriedJoint.push(marriedJointBracket2);
        marriedJoint.push(marriedJointBracket3);
        taxBrackets.push(marriedJoint);

        //married seperate:
        const marriedSeperateBracket1 = { rate: rate1, lowBound: 0, highBound: bracketValues[0] };
        const marriedSeperateBracket2 = { rate: rate2, lowBound: bracketValues[0] + 1, highBound: bracketValues[6] };
        const marriedSeperateBracket3 = { rate: rate3, lowBound: bracketValues[6] + 1, highBound: Infinity };
        marriedSeperate.push(marriedSeperateBracket1);
        marriedSeperate.push(marriedSeperateBracket2);
        marriedSeperate.push(marriedSeperateBracket3);
        taxBrackets.push(marriedSeperate);

        //head of household:
        const headOfHouseholdBracket1 = { rate: rate1, lowBound: 0, highBound: bracketValues[2] };
        const headOfHouseholdBracket2 = { rate: rate2, lowBound: bracketValues[2] + 1, highBound: bracketValues[10] };
        const headOfHouseholdBracket3 = { rate: rate3, lowBound: bracketValues[10] + 1, highBound: Infinity };
        headOfHousehold.push(headOfHouseholdBracket1);
        headOfHousehold.push(headOfHouseholdBracket2);
        headOfHousehold.push(headOfHouseholdBracket3);
        taxBrackets.push(headOfHousehold);


        return taxBrackets;
    }
    catch (error) {
        console.error('Error fetching capital gains tax rates:', error);
        return [];

    }
}
//fetchCapitalGainsData().then(data => console.log(data)).catch(err => console.error(err));

//scrape RMD tables
export async function fetchRMDTable() {
    try {
        const url = `${process.env.FED_RMD}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let rawtableData = [];



        const table = $('table[summary="Appendix B. Uniform Lifetime Table"]');

        if (!table.length) {
            console.log('Table with specified name not found.');
            return [];
        }




        table.find('tbody tr').each((index, element) => {
            const row = {};
            $(element).find('td').each((i, el) => {
                row[i] = $(el).text().trim();
            });
            rawtableData.push(row);
        });
        let ages = [];
        let distributions = [];
        let boolAtTable = false;
        let toBreak = false;

        //do left side first
        let p = 0;
        for (const i in rawtableData) {
            if (!boolAtTable) {
                if (rawtableData[i][0] === 'Age') {
                    boolAtTable = true;
                }
                continue;
            }
            //check to see if at '120 and over'
            let age = rawtableData[i][0];

            age = Number(age);
            let distribution = Number(rawtableData[i][1]);
            distributions.push(distribution);
            ages.push(age);

            p++;
        }
        //right side
        toBreak = false;
        boolAtTable = false;
        for (const i in rawtableData) {
            if (!boolAtTable) {
                if (rawtableData[i][0] === 'Age') {
                    boolAtTable = true;
                }
                continue;
            }
            //check to see if at '120 and over'
            let age = rawtableData[i][2];
            if (rawtableData[i][2] === '120 and over') {
                age = '120';
                toBreak = true;
            }
            age = Number(age);
            let distribution = Number(rawtableData[i][3]);
            distributions.push(distribution);
            ages.push(age);


            if (toBreak) break;
        }



        return { ages, distributions };
    } catch (error) {
        console.error('Error fetching Uniform Lifetime Table:', error);
        return [];
    }
}
//fetchRMDTable().then(data => console.log(data)).catch(err => console.error(err));