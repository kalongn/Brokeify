import mongoose from "mongoose";
import { Event, Rebalance, Invest, Income, Expense } from "../models/Event.js";

/**
 * @typedef {"INCOME" | "EXPENSE" | "INVEST" | "REBALANCE"} EVENT_TYPE
 */

/**
 * Controller for Event, Support CRUD operations for Event Class
 */
export default class EventController {
    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new Event with the given data and eventType
     * @param {EVENT_TYPE} eventType 
     *      Type of event to be created
     * @param {Event} data 
     *      The data for the event, check Event.js for the data structure for each respective event type
     *      
     * @returns 
     */
    async create(eventType, data) {
        try {
            let event;
            switch (eventType) {
                case "REBALANCE":
                    event = new Rebalance({ eventType, ...data });
                    break;

                case "INVEST":
                    event = new Invest({ eventType, ...data });
                    break;

                case "INCOME":
                    event = new Income({ eventType, ...data });
                    break;

                case "EXPENSE":
                    event = new Expense({ eventType, ...data });
                    break;

                default:
                    throw new Error("Unhandled event type");
            }
            await event.save();
            return event;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads all Events
     * @returns all Events
     */
    async readAll() {
        try {
            return await Event.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads an Event with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns the event with the given id
     */
    async read(id) {
        try {
            return await Event.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function updates the Event with the given id with the given data
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Event to be updated
     * @param {Event} data 
     *      Data for the Event, check Event.js for the data structure for each respective event type
     * @returns 
     *      The updated Event
     */
    async update(id, data) {
        try {
            const event = await Event.findById(id);
            switch (event.eventType) {
                case "REBALANCE":
                    return await Rebalance.findByIdAndUpdate
                        (id, data, { new: true, runValidators: true });
                case "INVEST":
                    return await Invest.findByIdAndUpdate
                        (id, data, { new: true, runValidators: true });
                case "INCOME":
                    return await Income.findByIdAndUpdate
                        (id, data, { new: true, runValidators: true });
                case "EXPENSE":
                    return await Expense.findByIdAndUpdate
                        (id, data, { new: true, runValidators: true });
                default:
                    throw new Error("Unhandled event type");
            }
        }
        catch {
            throw new Error(error);
        }
    }

    /**
     * This function deletes the Event with the given id and returns the deleted event
     * @param {mongoose.Types.ObjectId} id 
     * @returns deleted event
     */
    async delete(id) {
        try {
            return await Event.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}

