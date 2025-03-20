import mongoose from "mongoose";
import Scenario from "../models/Scenario.js";

import EventController from "./EventController.js";
import InvestmentTypeController from "./InvestmentTypeController.js";
import InvestmentController from "./InvestmentController.js";
import DistributionController from "./DistributionController.js";


/**
 * Controller for Scenario, Support CRUD operations for Scenario Class
 */
export default class ScenarioController {
    constructor() { }

    /**
     * This function create a new Scenario with the given data
     * @param {Scenario} data 
     * @returns 
     *      Returns the created Scenario
     * @throws Error
     *      Throws error if any error
     */
    async create(data) {
        try {
            const scenario = new Scenario(data);
            await scenario.save();
            return scenario;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function obtains all Scenarios
     * @returns 
     *      Returns all Scenarios
     * @throws Error
     *      Throws error if any error
     */
    async readAll() {
        try {
            return await Scenario.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads a Scenario with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Scenario to be read
     * @returns 
     *      Returns the Scenario with the given id
     */
    async read(id) {
        try {
            return await Scenario.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function updates a Scenario with the given id
     * @param {mongoose.Types.ObjectId} id
     *      Id of the Scenario to be updated
     * @param {Scenario} data
     *      Data for the Scenario
     * @returns
     *      Returns the updated Scenario
     * @throws Error
     *      Throws error if the Scenario is not found or if any error occurs
     */
    async update(id, data) {
        try {
            return await Scenario.findByIdAndUpdate(id, data, { new: true });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes the Scenario with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the deleted Scenario
     * @throws Error
     *      Throws error if the Scenario is not found or if any error occurs
     */
    async shallowDelete(id) {
        try {
            return await Scenario.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes a Scenario with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Scenario to be deleted
     * @returns 
     *      Returns the deleted Scenario
     * @throws Error
     *      Throws error if the Scenario is not found or if any error occurs
     */
    async delete(id) {
        try {
            const deleteScenario = await Scenario.findById(id).populate("investmentTypes");
            const eventController = new EventController();
            const investmentTypeController = new InvestmentTypeController();
            const investmentController = new InvestmentController();
            const distributionController = new DistributionController();

            for (const event of deleteScenario.events) {
                await eventController.delete(event);
            }

            for (const investmentType of deleteScenario.investmentTypes) {
                console.log(investmentType.investments);
                for (const investment of investmentType.investments) {
                    await investmentController.delete(investment);
                }
                await investmentTypeController.delete(investmentType);
            }

            await distributionController.delete(deleteScenario.inflationAssumptionDistribution);
            return await Scenario.deleteOne({ _id: id });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async clone(scenarioID){
        //deep clone scenario
        //Clone Investments
        //Clone Investment Types
        //Clone Events
    
        //Change ref Ids in:
        //orderedSpendingStrategy
        //orderedExpenseWithdrawalStrategy
        //orderedRMDStrategy
        //orderedRothStrategy
    
        //The following code was initially written by ChatGPT with the prompt:
        /*
            Write me a function that does a deep clone of scenario, making sure to clone 
            investments, Investment Types, and events. Also, ensure that
            ref ids are changed in orderedSpendingStrategy, orderedExpenseWithdrawalStrategy,
            orderedRMDStrategy, orderedRothStrategy: {pasted in scenario schema}
        */
        /*
            Takeaways: 
            - ChatGPT did not understand the structure of a database, or our controllers
            - Did a decent job at using javascript functionality
    
        */
       
        const scenarioFactory = new ScenarioController();
        const investmentTypeFactory = new InvestmentTypeController();
        const investmentFactory = new InvestmentController();
        const eventFactory = new EventController();
        const unmodifiedScenario = await scenarioFactory.read(scenarioID);
        const originalScenario = await unmodifiedScenario.populate('investmentTypes events orderedSpendingStrategy orderedExpenseWithdrawalStrategy orderedRMDStrategy orderedRothStrategy');
        // console.log("ORIGINAL")
        // console.log(originalScenario);
        
        if (!originalScenario) {
            throw new Error('Scenario not found');
        }
        //console.log(originalScenario);
        const idMap = new Map();
        
        // Clone Investment Types and Investments
        const clonedInvestmentTypes = await Promise.all(
            originalScenario.investmentTypes.map(async (typeId) => {
                const type = await investmentTypeFactory.read(typeId);
                if (!type) return null;
    
                const clonedInvestments = await Promise.all(
                    type.investments.map(async (invId) => {
                        const investment = await investmentFactory.read(invId);
                        if (!investment) return null;
    
                        const clonedInvestment = await investmentFactory.create({
                            value: investment.value,
                            taxStatus: investment.taxStatus,
                        });
    
                        idMap.set(invId.toString(), clonedInvestment.id);
                        return clonedInvestment.id;
                    })
                );
    
                const clonedType = await investmentTypeFactory.create({
                    name: type.name,
                    description:type.description,
                    expectedAnnualReturn:type.expectedAnnualReturn,
                    expectedAnnualReturnDistribution: type.expectedAnnualReturnDistribution,
                    expenseRatio: type.expenseRatio,
                    expectedAnnualIncome: type.expectedAnnualIncome,
                    expectedAnnualIncomeDistribution: type.expectedAnnualIncomeDistribution,
                    taxability: type.taxability,
                    investments: clonedInvestments.filter(Boolean),
                });
    
                idMap.set(typeId.toString(), clonedType.id);
                return clonedType.id;
            })
        );
    
        // Clone Events
        const clonedEvents = await Promise.all(
            originalScenario.events.map(async (eventId) => {
                const event = await eventFactory.read(eventId);
                if (!event) return null;
                //console.log({...event});
                let clonedEvent = null;
                if(event.eventType==="REBALANCE"){
                    clonedEvent = await eventFactory.create(event.eventType, {
                        eventType: event.eventType,
                        name: event.name,
                        description: event.description,
                        startYear: event.startYear,
                        startYearTypeDistribution: event.startYearTypeDistribution,
                        duration: event.duration,
                        durationTypeDistribution: event.durationTypeDistribution,
                        assetAllocationType: event.assetAllocationType,
                        percentageAllocations: event.percentageAllocations, 
                        allocatedInvestments: event.allocatedInvestments.map(id => idMap.get(id.toString())),
                        maximumCash: event.maximumCash,
                        taxStatus: event.taxStatus
                    });
                }
                if(event.eventType==="INVEST"){
                    clonedEvent = await eventFactory.create(event.eventType, {
                        eventType: event.eventType,
                        name: event.name,
                        description: event.description,
                        startYear: event.startYear,
                        startYearTypeDistribution: event.startYearTypeDistribution,
                        duration: event.duration,
                        durationTypeDistribution: event.durationTypeDistribution,
                        assetAllocationType: event.assetAllocationType,
                        percentageAllocations: event.percentageAllocations, 
                        allocatedInvestments: event.allocatedInvestments.map(id => idMap.get(id.toString())),
                        maximumCash: event.maximumCash,
                    });
                }
                if(event.eventType==="INCOME"){
                    clonedEvent = await eventFactory.create(event.eventType, {
                        eventType: event.eventType,
                        name: event.name,
                        description: event.description,
                        startYear: event.startYear,
                        startYearTypeDistribution: event.startYearTypeDistribution,
                        duration: event.duration,
                        durationTypeDistribution: event.durationTypeDistribution,
                        amount: event.amount,
                        expectedAnnualChange: event.expectedAnnualChange,
                        expectedAnnualChangeDistribution: event.expectedAnnualChangeDistribution,
                        isinflationAdjusted: event.isinflationAdjusted,
                        userContributions: event.userContributions,
                        spouseContributions:event.spouseContributions,
                        isSocialSecurity: event.isSocialSecurity,
                    });
                }
                if(event.eventType==="EXPENSE"){
                    clonedEvent = await eventFactory.create(event.eventType, {
                        eventType: event.eventType,
                        name: event.name,
                        description: event.description,
                        startYear: event.startYear,
                        startYearTypeDistribution: event.startYearTypeDistribution,
                        duration: event.duration,
                        durationTypeDistribution: event.durationTypeDistribution,
                        amount: event.amount,
                        expectedAnnualChange:event.expectedAnnualChange,
                        expectedAnnualChangeDistribution:event.expectedAnnualChangeDistribution,
                        isinflationAdjusted: event.isinflationAdjusted,
                        userContributions: event.userContributions,
                        spouseContributions: event.spouseContributions,
                        isDiscretionary: event.isDiscretionary,
                    });
                }
                
    
                idMap.set(eventId.toString(), clonedEvent.id);
                return clonedEvent.id;
            })
        );
    
        // Clone Scenario
        //console.log(`CLONING: ${originalScenario.inflationAssumptionDistribution}`);
        const clonedScenario = await scenarioFactory.create({
            name: `${originalScenario.name} CLONE`,
            filingStatus: originalScenario.filingStatus,
            userBirthYear: originalScenario.userBirthYear,
            spouseBirthYear: originalScenario.spouseBirthYear,
            userLifeExpectancy: originalScenario.userLifeExpectancy,
            spouseLifeExpectancy: originalScenario.spouseLifeExpectancy,
            investmentTypes: clonedInvestmentTypes.filter(Boolean),
            events: clonedEvents.filter(Boolean),
            inflationAssumption: originalScenario.inflationAssumption,
            inflationAssumptionDistribution: originalScenario.inflationAssumptionDistribution,
            annualPreTaxContributionLimit: originalScenario.annualPreTaxContributionLimit,
            annualPostTaxContributionLimit: originalScenario.annualPostTaxContributionLimit,
            financialGoal: originalScenario.financialGoal,
            orderedSpendingStrategy: originalScenario.orderedSpendingStrategy.map(id => idMap.get(id.toString()) || id),
            orderedExpenseWithdrawalStrategy: originalScenario.orderedExpenseWithdrawalStrategy.map(id => idMap.get(id.toString()) || id),
            orderedRMDStrategy: originalScenario.orderedRMDStrategy.map(id => idMap.get(id.toString()) || id),
            orderedRothStrategy: originalScenario.orderedRothStrategy.map(id => idMap.get(id.toString()) || id),
            startYearRothOptimizer: originalScenario.startYearRothOptimizer,
            endYearRothOptimizer:originalScenario.endYearRothOptimizer,
            
        });
        //console.log("CLONED:");
        //console.log(await clonedScenario.populate('investmentTypes events orderedSpendingStrategy orderedExpenseWithdrawalStrategy orderedRMDStrategy orderedRothStrategy'));
        return clonedScenario;
    }


    async eraseScenario(scenarioID){
        //erase the scenario and all investments, events, investmentTypes associated with it
        const scenarioFactory = new ScenarioController();
        const investmentTypeFactory = new InvestmentTypeController();
        const investmentFactory = new InvestmentController();
        const eventFactory = new EventController();
        const scenario = await scenarioFactory.read(scenarioID);
        //first, get & erase all investments & investmentTypes
        for(const i in scenario.investmentTypes){
            const investmentType = await investmentTypeFactory.read(scenario.investmentTypes[i]);
            for(const j in investmentType.investments){
                await investmentFactory.delete(investmentType.investments[j]);
            }
            await investmentTypeFactory.shallowDelete(scenario.investmentTypes[i]); 
        }
        //erase all events
        for(const i in scenario.events){
            await eventFactory.shallowDelete(scenario.events[i]);
        }
        //erase scenario
        await scenarioFactory.shallowDelete(scenarioID);
    }
}