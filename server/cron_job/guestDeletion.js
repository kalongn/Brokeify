import mongoose from 'mongoose';
import cron from 'node-cron';
import 'dotenv/config'

import User from '../db/models/User.js';
import UserController from "../db/controllers/UserController.js";

const userController = new UserController();

const guestDeletionCronJob = () => {
    cron.schedule('0 */4 * * *', async () => {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const guestsToDelete = await User.find({
                permission: 'GUEST',
                lastLogin: { $lt: oneDayAgo }
            });
            if (guestsToDelete.length > 0) {
                console.log(`Deleting ${guestsToDelete.length} guest users...`);
                for (const guest of guestsToDelete) {
                    await userController.deepDeleteGuest(guest._id);
                    console.log(`Deleted guest user: ${guest._id}`);
                }
            } else {
                console.log('No guest users to delete.');
            }
        } catch (error) {
            console.error('Error in guest deletion cron job:', error);
        }
    });

    console.log('Guest deletion cron job initialized: Running every 4 hours');
}

export default guestDeletionCronJob;