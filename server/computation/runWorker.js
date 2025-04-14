import {parentPort, workerData } from 'worker_threads';
import * as inspector from 'node:inspector';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';

function startCoverage() {
    const session = new inspector.Session();
    session.connect();
    session.post('Profiler.enable');
    session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

    process.on('exit', () => {
        session.post('Profiler.takePreciseCoverage', (err, { result }) => {
            if (!err) {
                const coverageDir = process.env.NODE_V8_COVERAGE;
                fs.mkdirSync(coverageDir, { recursive: true });
                fs.writeFileSync(
                    path.join(coverageDir, `${process.pid}.json`),
                    JSON.stringify({ result })
                );
            }
            session.disconnect();
        });
    });
}

if (process.env.NODE_V8_COVERAGE) {
    startCoverage();
}


import mongoose from "mongoose";
const {run} = await import('./planValidator.js');

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
            workerData.logFile
        );
        
        parentPort.postMessage(JSON.parse(JSON.stringify(result)));
        await mongoose.disconnect();
    } catch (err) {
        parentPort.postMessage({ error: err.message });
    }
}
  

await main();

