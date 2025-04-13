import express from 'express';
import multer from 'multer';
import yaml from 'js-yaml';
import fs from 'fs';

import { exportScenarioAsYAML } from '../yaml_parsers/scenarioExporter.js';
import { parseAndSaveYAML } from '../yaml_parsers/scenarioParser.js';
import { canView } from './helper.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/scenario/:scenarioId/export', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    const scenarioId = req.params.scenarioId;
    if (!(await canView(req.session.user, scenarioId))) {
        return res.status(403).send("You do not have permission to access this scenario.");
    }

    try {
        const { filename, yamlStr } = await exportScenarioAsYAML(scenarioId);
        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(yamlStr);
    } catch (error) {
        console.error("Error exporting scenario as YAML:", error);
        res.status(500).send("Error exporting scenario.");
    }
});

router.post(('/scenario/import'), upload.single('file'), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const filePath = req.file.path; // Path to the uploaded file
        const fileContent = fs.readFileSync(filePath, 'utf8'); // Read the file content
        const yamlStr = yaml.load(fileContent);
        fs.unlinkSync(filePath);
        const scenarioId = await parseAndSaveYAML(yamlStr, req.session.user);
        res.status(200).send({
            message: "Scenario imported successfully.",
            scenarioId: scenarioId
        });
    } catch (error) {
        console.error("Error importing scenario from YAML:", error);
        res.status(500).send("Error importing scenario.");
    }
});

export default router;
