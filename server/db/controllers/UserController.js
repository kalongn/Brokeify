import mongoose from "mongoose";
import User from "../models/User.js";

/**
 * Controller for User, Support CRUD operations for User Class
 */
export default class UserController {
    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new User with the given data
     * @param {User} data 
     * @returns 
     *      Returns the created User
     * @throws Error
     *      Throws error if any error occurs
     */
    async create(data) {
        try {
            const user = new User(data);
            await user.save();
            return user;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads all Users
     * @returns 
     *      Returns all Users
     * @throws Error
     *      Throws error if any error occurs
     */
    async readAll() {
        try {
            return await User.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads a User with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the User to be read
     * @returns 
     *      Returns the User with the given id
     * @throws Error
     *      Throws error if the User is not found or if any error occurs
     */
    async read(id) {
        try {
            return await User.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function finds a User with the given googleId
     *      This is used for authentication with Google
     *      and to check if the User already exists in the database
     *      before creating a new User
     * @param {String} googleId 
     *      Google Id of the User to be found
     * @returns 
     *      Returns the User with the given googleId
     * @throws Error
     *      Throws error if the User is not found or if any error occurs
     */
    async findByGoogleId(googleId) {
        try {
            return await User.findOne
                ({ googleId });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes a User with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the User to be deleted
     * @param {User} data 
     *      Data for the User to be updated
     * @returns 
     *      Returns the updated User
     */
    async update(id, data) {
        try {
            return await User.findByIdAndUpdate(id, data, {
                new: true
            });
        }
        catch (error) {
            throw new Error(error);
        }
    }
}