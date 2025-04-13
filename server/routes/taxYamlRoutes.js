import express from 'express';
import multer from 'multer';
import yaml from 'js-yaml';
import fs from 'fs';

import UserController from '../db/controllers/UserController.js';
import TaxController from '../db/controllers/TaxController.js';
import { parseStateTaxYAML, exportStateTaxToYAML } from '../yaml_parsers/stateTaxParser.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const userController = new UserController();
const taxController = new TaxController();

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
        return res.status(200).send(yamlStr);
    } catch (error) {
        console.error("Error exporting state tax as YAML:", error);
        return res.status(500).send("Error exporting state tax.");
    }
});

router.delete('/stateTax/:taxId/delete', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    const taxId = req.params.taxId;
    try {
        const user = await userController.read(req.session.user);
        if (!user.userSpecificTaxes.some(t => t.toString() === taxId)) {
            return res.status(403).send("You do not have permission to access this tax.");
        }
        await userController.update(req.session.user, {
            $pull: { userSpecificTaxes: taxId }
        });

        await taxController.delete(taxId);
        return res.status(200).send("Tax deleted successfully.");
    } catch (error) {
        console.error("Error deleting state tax:", error);
        return res.status(500).send("Error deleting state tax.");
    }
});

router.post('/stateTax/import', upload.single('file'), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const filePath = req.file.path; // Path to the uploaded file
        const fileContent = fs.readFileSync(filePath, 'utf8'); // Read the file content
        const yamlStr = yaml.load(fileContent);
        fs.unlinkSync(filePath);
        const status = await parseStateTaxYAML(yamlStr, req.session.user);
        if (status === 1) {
            return res.status(409).send("Tax already exists.");
        }
        return res.status(200).send("Tax imported successfully.");
    } catch (error) {
        console.error("Error importing state tax from YAML:", error);
        resreturn.status(500).send("Error importing state tax.");
    }
});

export default router;