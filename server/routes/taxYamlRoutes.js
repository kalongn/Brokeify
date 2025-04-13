import express from 'express';
import multer from 'multer';
import yaml from 'js-yaml';
import fs from 'fs';

import UserController from '../db/controllers/UserController.js';
import { parseStateTaxYAML, exportStateTaxToYAML } from '../yaml_parsers/stateTaxParser.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const userController = new UserController();

router.get('/stateTax/:taxId/export', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    const taxId = req.params.taxId;
    try {
        const { yamlStr, fileName } = await exportStateTaxToYAML(taxId);
        const user = await userController.read(req.session.user);
        if (!user.userSpecificTaxes.some(t => t.toString() === taxId)) {
            return res.status(403).send("You do not have permission to access this tax.");
        }
        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.yaml"`);
        res.status(200).send(yamlStr);
    } catch (error) {
        console.error("Error exporting state tax as YAML:", error);
        res.status(500).send("Error exporting state tax.");
    }
});

export default router;