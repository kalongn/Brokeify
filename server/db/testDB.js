import mongoose from "mongoose";
import 'dotenv/config'

import DistributionController from "./controllers/DistributionController.js";
import InvestmentTypeController from "./controllers/InvestmentTypeController.js";

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
        await factory.create("NORMAL_PERCENTAGE", { mean: 0.1, standardDeviation: 0.01 });
        await factory.create("MARKOV_PERCENTAGE", {
            initialValue: 100,
            driftMu: 0.1,
            volatileSigma: 0.01,
            timeStepDeltaT: 0.01,
            randomEpsilon: await factory.create("NORMAL_PERCENTAGE", { mean: 0, standardDeviation: 0.01 })
        });

        const distributions = await factory.readAll();
        console.log(distributions);

        const distribution = await factory.read(distributions[0].id);
        console.log(distribution);

        await factory.update(distribution.id, { value: 200 });
        const updatedDistribution = await factory.read(distribution.id);
        console.log(updatedDistribution);

        await factory.delete(updatedDistribution.id);
        const deletedDistribution = await factory.read(updatedDistribution.id);
        console.log(deletedDistribution);
    } catch (error) {
        console.error(error);
    }
}

const testInvestmentType = async () => {
    const factory = new InvestmentTypeController();
    try {
        await factory.create({
            name: "Fixed Income",
            description: "Fixed income investments pay a fixed rate of return on a fixed schedule.",
            expectedAnnualReturn: 0.05,
            expectedAnnualReturnDistribution: await factory.createDistribution("FIXED_PERCENTAGE", { value: 0.05 }),
            expenseRatio: 0.01,
            expectedAnnualIncome: 1000,
            expectedAnnualIncomeDistribution: await factory.createDistribution("FIXED_AMOUNT", { value: 1000 }),
            taxability: true
        });

        const investmentTypes = await factory.readAll();
        console.log(investmentTypes);

        const investmentType = await factory.read(investmentTypes[0].id);
        console.log(investmentType);

        await factory.update(investmentType.id, { name: "Equity" });
        const updatedInvestmentType = await factory.read(investmentType.id);
        console.log(updatedInvestmentType);

        await factory.delete(updatedInvestmentType.id);
        const deletedInvestmentType = await factory.read(updatedInvestmentType.id);
        console.log(deletedInvestmentType);
    } catch (error) {
        console.error(error);
    }
}

const populateDB = async () => {
    // console.log('====================== Distribution Test ======================');
    // await testDistruibution();
    // console.log('====================== Distribution Test Done ======================');
    console.log('====================== Investment Type Test =====================');
    await testInvestmentType();
    console.log('====================== Investment Type Test Done ======================');
};
