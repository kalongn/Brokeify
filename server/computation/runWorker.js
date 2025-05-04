import {parentPort, workerData } from 'worker_threads';
import { run } from './planValidator.js';
import mongoose from "mongoose";
const DB_ADDRESS = `${process.env.DB_ADDRESS}`;
async function main() {
    const batchResults = [];
    const tasksBatch = workerData.tasksBatch; 
    const workerIndex = workerData.workerIndex; 

    if (!tasksBatch || !Array.isArray(tasksBatch)) {
        parentPort.postMessage({ error: "Invalid or missing tasksBatch in workerData" });
        return;
    }
    try {
        await mongoose.connect(DB_ADDRESS);
        for (let i = 0; i < tasksBatch.length; i++) {
            const taskData = tasksBatch[i];
            console.log(`Worker ${workerIndex}: Starting task ${i + 1}/${tasksBatch.length}`);

            try {
                const result = await run(
                    taskData.scenarioID, 
                    taskData.fedIncome,  
                    taskData.capitalGains,
                    taskData.fedDeduction,
                    taskData.stateTax,
                    taskData.rmdTable,
                    taskData.csvFile,     
                    taskData.logFile,     
                    taskData.explorationArray,
                    taskData.step1,
                    taskData.step2,
                    taskData.seed,
                );
                batchResults.push(JSON.parse(JSON.stringify(result)));
            }
            catch (taskError) {
                console.error(`Worker ${workerIndex}: Error processing task ${i} (Scenario: ${taskData.scenarioID}, Step1: ${taskData.step1}, Step2: ${taskData.step2}):`, taskError);
            }
        }
        parentPort.postMessage(batchResults);
        mongoose.disconnect();
    } catch (err) {
        parentPort.postMessage({ error: err.message });
    }
}
  
main();