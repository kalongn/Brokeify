import mongoose from "mongoose";
import 'dotenv/config'

import DistributionController from "./controllers/DistributionController.js";

// Connect to MongoDB
const DB_ADDRESS = `${process.env.DB_ADDRESS}`;

mongoose.connect(DB_ADDRESS);
const connection = mongoose.connection;

connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

connection.once('open', async () => {
    await populateDB();
    connection.close();
    process.exit();
});

const testDistruibution = async () => {
    const factory = new DistributionController();
    try {
        await factory.create("FIXED_AMOUNT", { value: 100 });
        await factory.create("FIXED_PERCENTAGE", { value: 0.1 });
        await factory.create("UNIFORM_AMOUNT", { lowerBound: 50, upperBound: 150 });
        await factory.create("UNIFORM_PERCENTAGE", { lowerBound: 0.05, upperBound: 0.15 });
        await factory.create("NORMAL_AMOUNT", { mean: 100, standardDeviation: 10 });
        await factory.create("NORMAL_PERCENTAGE", { mean: 0.1, stdDev: 0.01 });
        await factory.create("MARKOV_PERCENTAGE", {
            initialValue: 100,
            driftMu: 0.1,
            volatileSigma: 0.01,
            timeStepDeltaT: 0.01,
            randomEpsilon: await factory.create("NORMAL_PERCENTAGE", { mean: 0, standardDeviation: 0.01 })
        });
    } catch (error) {
        console.error(error);
    }
}

const populateDB = async () => {
    await testDistruibution();
};
