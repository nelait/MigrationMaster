const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { evaluateCode } = require('../services/llmService');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/migrations/:id/evaluation
router.get('/migrations/:id/evaluation', authMiddleware, async (req, res) => {
    try {
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
            include: { evaluations: true, files: true, generatedCode: true }
        });

        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        // Check if evaluation already exists
        if (migration.evaluations.length > 0) {
            const latest = migration.evaluations[migration.evaluations.length - 1];
            return res.json(JSON.parse(latest.metrics));
        }

        // Get LLM config assigned to the 'evaluate' stage
        const allConfigs = await prisma.llmConfig.findMany({
            where: { userId: req.user.userId }
        });
        const llmConfig = allConfigs.find(c => c.activeFor && c.activeFor.split(',').includes('evaluate')) || null;

        // Evaluate (real LLM or mock)
        let evaluation;
        let warning = null;
        let llmError = null;
        let source = 'llm';

        try {
            evaluation = await evaluateCode(migration.files, migration.generatedCode, llmConfig);
            if (!llmConfig) source = 'mock';
        } catch (err) {
            console.error('LLM evaluation failed, falling back to mock:', err.message);
            const { generateEvaluation } = require('../services/mockLLM');
            evaluation = generateEvaluation();
            source = 'mock';
            llmError = err.message;
            warning = `LLM call failed (${llmConfig?.label || llmConfig?.provider}): ${err.message}. Showing mock data instead.`;
        }

        // Store evaluation (include warning metadata if any)
        const metricsToStore = { ...evaluation };
        if (warning) metricsToStore._warning = warning;
        if (llmError) metricsToStore._llmError = llmError;
        metricsToStore._source = source;

        await prisma.evaluation.create({
            data: {
                migrationId: migration.id,
                metrics: JSON.stringify(metricsToStore)
            }
        });

        // Update migration status
        await prisma.migration.update({
            where: { id: migration.id },
            data: { status: 'evaluated' }
        });

        // Track LLM usage
        await prisma.llmUsage.create({
            data: {
                migrationId: migration.id,
                stage: 'evaluate',
                provider: llmConfig?.provider || 'mock',
                model: llmConfig?.model || 'mock',
                label: llmConfig?.label || 'Mock Data'
            }
        });

        // Return evaluation with warning metadata
        const response = { ...evaluation };
        if (!llmConfig) response._warning = 'No LLM configured for the "Evaluate" stage. Showing mock data. Go to Settings to assign an LLM.';
        if (warning) response._warning = warning;
        if (llmError) response._llmError = llmError;
        response._source = source;

        res.json(response);
    } catch (err) {
        console.error('Evaluation error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
