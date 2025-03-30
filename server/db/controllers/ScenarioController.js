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

    async readWithPopulate(id) {
        try {
            return await Scenario.findById(id).populate({
                path: 'investmentTypes',
                populate: {
                    path: 'expectedAnnualReturnDistribution expectedAnnualIncomeDistribution investments',
                }
            })
                .populate({
                    path: 'events',
                    populate: {
                        path: 'startYearTypeDistribution durationTypeDistribution',
                    }
                })
                .populate('inflationAssumptionDistribution userLifeExpectancyDistribution spouseLifeExpectancyDistribution');
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

    async clone(scenarioID) {
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
        const originalScenario = unmodifiedScenario;
        // console.log("ORIGINAL")
        // console.log(originalScenario);

        if (!originalScenario) {
            throw new Error('Scenario not found');
        }
        //console.log(originalScenario);
        const idMap = new Map();
        // console.log("here");
        // Clone Investment Types and Investments
        const clonedInvestmentTypes = []
        for(const typeIndex in originalScenario.investmentTypes){
            let typeId = originalScenario.investmentTypes[typeIndex].hasOwnProperty('id') ? originalScenario.investmentTypes[typeIndex].id : originalScenario.investmentTypes[typeIndex];
            
            const type = await investmentTypeFactory.read(typeId);
            
            if (!type) continue;
            const clonedInvestments = []
            for(const invIdIndex in type.investments){
                const invId = type.investments[invIdIndex]
                const clonedInvID = await investmentFactory.clone(invId);

                idMap.set(invId.toString(), clonedInvID);
                clonedInvestments.push(clonedInvID);
                //return clonedInvID;
            }
            
            
            const clonedTypeID = await investmentTypeFactory.clone(type.id)
            await investmentTypeFactory.update(clonedTypeID, {investments: clonedInvestments.filter(Boolean)});
            idMap.set(typeId.toString(), clonedTypeID);
            clonedInvestmentTypes.push(clonedTypeID)
            //return clonedTypeID;
        }
        //console.log("here2");
        // Clone Events
        //console.log(originalScenario.events);
        const clonedEvents = []
        for(const eventIndex in originalScenario.events){
            //console.log(eventIndex);
            let eventId = originalScenario.events[eventIndex];
            const clonedEventID = await eventFactory.clone(eventId);
            //console.log(clonedEventID);
            let clonedEvent = await eventFactory.read(clonedEventID);
            //console.log(clonedEvent);
            if(!clonedEvent) continue;
            if(clonedEvent.eventType=="REBALANCE"||clonedEvent.eventType=="INVEST"){
                //update allocatedInvestments
                let updatedAllocatedInvestmnets = await clonedEvent.allocatedInvestments.map(id => idMap.get(id.toString()));
                for(const j in updatedAllocatedInvestmnets){
                    updatedAllocatedInvestmnets[j] = new mongoose.Types.ObjectId(updatedAllocatedInvestmnets[j]);
                }
                
                await eventFactory.update(clonedEventID, {allocatedInvestments: updatedAllocatedInvestmnets})
                //console.log("after")
                //clonedEvent = await eventFactory.read(clonedEventID);
                
            }
            idMap.set(eventId.toString(), clonedEventID);
            //console.log(clonedEventID)
            clonedEvents.push(clonedEventID)
            //return clonedEventID;    
        }


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
            orderedSpendingStrategy: originalScenario.orderedSpendingStrategy.map(id => idMap.get(id.toString())),
            orderedExpenseWithdrawalStrategy: originalScenario.orderedExpenseWithdrawalStrategy.map(id => idMap.get(id.toString())),
            orderedRMDStrategy: originalScenario.orderedRMDStrategy.map(id => idMap.get(id.toString())),
            orderedRothStrategy: originalScenario.orderedRothStrategy.map(id => idMap.get(id.toString())),
            startYearRothOptimizer: originalScenario.startYearRothOptimizer,
            endYearRothOptimizer: originalScenario.endYearRothOptimizer,

        });
        
        //console.log("CLONED:");
        //console.log(await clonedScenario.populate('investmentTypes events orderedSpendingStrategy orderedExpenseWithdrawalStrategy orderedRMDStrategy orderedRothStrategy'));
        return clonedScenario;
    }


    async deleteNotDistributions(scenarioID) {
        //erase the scenario and all investments, events, investmentTypes associated with it
        const scenarioFactory = new ScenarioController();
        const investmentTypeFactory = new InvestmentTypeController();
        const investmentFactory = new InvestmentController();
        const eventFactory = new EventController();
        const scenario = await scenarioFactory.read(scenarioID);
        //first, get & erase all investments & investmentTypes
        for (const i in scenario.investmentTypes) {
            const investmentType = await investmentTypeFactory.read(scenario.investmentTypes[i]);
            for (const j in investmentType.investments) {
                await investmentFactory.delete(investmentType.investments[j]);
            }
            await investmentTypeFactory.shallowDelete(scenario.investmentTypes[i]);
        }
        //erase all events
        for (const i in scenario.events) {
            await eventFactory.shallowDelete(scenario.events[i]);
        }
        //erase scenario
        await scenarioFactory.shallowDelete(scenarioID);
    }

    
}