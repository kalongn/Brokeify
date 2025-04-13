import express from 'express';

import UserController from '../db/controllers/UserController.js';

const router = express.Router();
const userController = new UserController();

router.get("/profile", async (req, res) => {
    if (req.session.user) {
        try {
            const user = await userController.readWithTaxes(req.session.user);

            const taxes = user.userSpecificTaxes.map(tax => {
                return {
                    id: tax._id,
                    taxType: tax.taxType,
                    year: tax.year,
                    filingStatus: tax.filingStatus,
                    dateCreated: tax.dateCreated,
                    state: tax.state,
                }
            });

            const data = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                picture: user.picture,
                userSpecificTaxes: taxes,
            }

            return res.status(200).send(data);
        } catch (error) {
            console.error("Error in profile route:", error);
            return res.status(500).send("Error retrieving user profile.");
        }
    } else {
        res.status(401).send("Unauthorized: Not logged in.");
    }
});

export default router;