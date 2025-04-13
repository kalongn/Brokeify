import express from 'express';
import { exportScenarioAsYAML } from '../yaml_parsers/scenarioExporter.js';
import { canView } from './helper.js';

const router = express.Router();

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

export default router;
