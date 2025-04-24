import mongoose from "mongoose";
import { Event, Rebalance, Invest, Income, Expense } from "../models/Event.js";
import DistributionController from "./DistributionController.js";

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
     * Reads multiple Events with the given array of IDs
     * @param {mongoose.Types.ObjectId[]} ids An array of Event IDs
     * @returns {Promise<Array<Event>>} A Promise that resolves to an array of Event objects
     */
    async readMany(ids) {
        try {
            if (!Array.isArray(ids) || ids.length === 0) {
                return [];
            }
            const events = await mongoose.model('Event').find({ _id: { $in: ids } }).exec();
            return events;
        } catch (error) {
            throw new Error(error);
        }
    }

    async readWithPopulate(id) {
        try {
            const event = await Event.findById(id)
                .populate("startYearTypeDistribution durationTypeDistribution expectedAnnualChangeDistribution");
            return event;
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
                        (id, data, { new: true });
                case "INVEST":
                    return await Invest.findByIdAndUpdate
                        (id, data, { new: true });
                case "INCOME":
                    return await Income.findByIdAndUpdate
                        (id, data, { new: true });
                case "EXPENSE":
                    return await Expense.findByIdAndUpdate
                        (id, data, { new: true });
                default:
                    throw new Error("Unhandled event type");
            }
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes the Event with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the deleted Event
     * @throws Error
     *      Throws error if the Event is not found or if any error occurs
     */
    async shallowDelete(id) {
        try {
            return await Event.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes the Event with the given id and returns the deleted event, 
     * it also deletes the associated distributions of the event
     * @param {mongoose.Types.ObjectId} id 
     * @returns deleted event
     */
    async delete(id) {
        try {
            const distributionController = new DistributionController();
            const event = await Event.findById(id);
            distributionController.delete(event.startYearTypeDistribution);
            distributionController.delete(event.durationTypeDistribution);
            if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {
                distributionController.delete(event.expectedAnnualChangeDistribution);
            }
            return await Event.deleteOne({ _id: id });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async clone(id) {
        try {
            const event = await Event.findById(id);
            if (!event) {
                return null;
            }
            let clonedEvent = event;
            clonedEvent._id = new mongoose.Types.ObjectId();
            clonedEvent.isNew = true;
            await clonedEvent.save();
            return clonedEvent.id;
        } catch (err) {
            throw new Error(err);
        }
    }
}

