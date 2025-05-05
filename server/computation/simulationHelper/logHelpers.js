

import { readFileSync, writeFileSync, existsSync, appendFileSync, fstat } from 'fs';
import { investmentTypeFactory,
        investmentFactory,
        eventFactory,
        scenarioFactory,
        taxFactory,
        simulationFactory,
        distributionFactory,
        resultFactory,
} from './simulationHelper.js';
import { logFile, csvFile } from '../simulator.js';

//Asked Gemini 2.5 Pro to use the new maps instead of db reads/writes in this function
export function updateCSV(currentYear, allInvestmentsMap, investmentTypesMap, invMap, csvFilePath) {
    // Use the passed csvFilePath argument
    if (csvFilePath === null || csvFilePath === undefined) {
        return;
    }

    let csvContent = [];
    const fileExists = existsSync(csvFilePath);
    if (fileExists) {
        // Read existing content, handle potential empty file
        const rawContent = readFileSync(csvFilePath, 'utf8').trim();
        if (rawContent) {
            csvContent = rawContent.split('\n').map(row => row.split(','));
        }
    }

    // Ensure csvContent has at least a header row structure if file was empty or just created
    if (csvContent.length === 0) {
        csvContent.push(['Year']); // Start with Year header
    }

    let headers = csvContent[0];

    // 1. Build current investment information from maps
    const currentInvestmentInfo = new Map(); // Map<investmentId, { name: string, value: number }>
    const currentHeaderNameToId = new Map();   // Map<headerName, investmentId> - for lookup

    allInvestmentsMap.forEach((invObject, invId) => {
        const typeId = invMap.get(invId.toString());
        const typeObject = typeId ? investmentTypesMap.get(typeId.toString()) : null;

        if (typeObject) { // Only include investments whose type is known
            const headerName = `${typeObject.name}:${invObject.taxStatus}`;
            currentInvestmentInfo.set(invId.toString(), { name: headerName, value: invObject.value });
            // If multiple investments could potentially have the same name (e.g. Cash:CASH),
            // this mapping might only store the last one. The logic below handles this.
            currentHeaderNameToId.set(headerName, invId.toString());
        }
    });

    // 2. Identify new headers and update the main header list
    const existingHeadersSet = new Set(headers.slice(1)); // Exclude 'Year'
    const finalHeaders = [...headers]; // Create a mutable copy
    const addedHeaders = [];

    currentInvestmentInfo.forEach((info) => {
        if (!existingHeadersSet.has(info.name)) {
            if (!finalHeaders.includes(info.name)) { // Ensure not added duplicates in this pass
                 finalHeaders.push(info.name);
                 addedHeaders.push(info.name);
            }
        }
    });

    // 3. Pad existing rows if new columns were added
    if (addedHeaders.length > 0) {
        csvContent[0] = finalHeaders; // Update the header row in our data structure
        for (let i = 1; i < csvContent.length; i++) {
            // Add empty strings (or '0') for the new columns in older rows
            csvContent[i].push(...Array(addedHeaders.length).fill(''));
        }
    }

    // 4. Build the new data row based on the final header order
    const newRowValues = new Map(); // Map<headerName, value>
    currentInvestmentInfo.forEach(info => {
        newRowValues.set(info.name, info.value);
    });

    const newRow = [currentYear];
    for (let i = 1; i < finalHeaders.length; i++) { // Start from 1 to skip 'Year'
        const headerName = finalHeaders[i];
        newRow.push(newRowValues.get(headerName) ?? ''); // Use empty string or 0 for missing values
    }

    // 5. Add the new row to the content
    csvContent.push(newRow);

    // 6. Write the updated content back to the CSV file
    try {
        const csvString = csvContent.map(row => row.join(',')).join('\n');
        writeFileSync(csvFilePath, csvString, 'utf8');
    } catch (error) {
        console.error(`Error writing to CSV file ${csvFilePath}:`, error);
    }
}

export function updateLog(eventDetails) {
    //const EVENT_TYPE = ['INCOME', 'EXPENSE', 'ROTH', 'RMD', 'TAX', 'INVEST', 'REBALANCE'];
    //details has data based on event type
    if (logFile === null || logFile === undefined) {
        return;
    }
    appendFileSync(logFile, eventDetails);


}
