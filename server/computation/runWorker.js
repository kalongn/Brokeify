import {parentPort, workerData } from 'worker_threads';
import { run } from './planValidator.js';
import mongoose from "mongoose";
const DB_ADDRESS = `${process.env.DB_ADDRESS}`;
async function main() {
    try {
        await mongoose.connect(DB_ADDRESS);
        const result = await run(
            workerData.scenarioID,
            workerData.fedIncome,
            workerData.capitalGains,
            workerData.fedDeduction,
            workerData.stateTax,
            workerData.rmdTable,
            workerData.csvFile,
            workerData.logFile,
            workerData.explorationArray,
            workerData.step1,
            workerData.step2,
            workerData.seed,
        );
        
        parentPort.postMessage(JSON.parse(JSON.stringify(result)));
        mongoose.disconnect();
    } catch (err) {
        parentPort.postMessage({ error: err.message });
    }
}
  
main();