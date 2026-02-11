const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { analyzeCode } = require('../services/llmService');
const { getRelevantContext } = require('../services/documentService');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/migrations/:id/analyze
router.post('/migrations/:id/analyze', authMiddleware, async (req, res) => {
    try {
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
            include: { files: true }
        });

        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        if (migration.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded yet. Please upload PHP files first.' });
        }

        // Get LLM config assigned to the 'analyze' stage
        const allConfigs = await prisma.llmConfig.findMany({
            where: { userId: req.user.userId }
        });
        const llmConfig = allConfigs.find(c => c.activeFor && c.activeFor.split(',').includes('analyze')) || null;

        // Run analysis (real LLM if configured, mock fallback)
        let analysis;
        let warning = null;
        let llmError = null;
        let source = 'llm';

        try {
            // Fetch reference document context for the user
            const referenceContext = await getRelevantContext(migration.files, req.user.userId);

            analysis = await analyzeCode(migration.files, llmConfig, referenceContext);
            if (!llmConfig) source = 'mock';
        } catch (err) {
            console.error('LLM analysis failed, falling back to mock:', err.message);
            const { analyzePhpCode } = require('../services/mockLLM');
            analysis = analyzePhpCode(migration.files);
            source = 'mock';
            llmError = err.message;
            warning = `LLM call failed (${llmConfig?.label || llmConfig?.provider}): ${err.message}. Showing mock data instead.`;
        }

        // Store artifacts
        const artifactTypes = [
            { type: 'screens', title: 'Screens', content: JSON.stringify(analysis.screens, null, 2) },
            { type: 'fields', title: 'Fields', content: JSON.stringify(analysis.fields, null, 2) },
            { type: 'validations', title: 'Validations', content: JSON.stringify(analysis.validations, null, 2) },
            { type: 'apis', title: 'APIs', content: JSON.stringify(analysis.apis, null, 2) },
            { type: 'db_objects', title: 'Database Objects', content: JSON.stringify(analysis.dbObjects, null, 2) },
            { type: 'queries', title: 'Queries', content: JSON.stringify(analysis.queries, null, 2) },
            { type: 'data_model', title: 'Data Model', content: JSON.stringify(analysis.dataModel, null, 2) },
            { type: 'business_logic', title: 'Business Logic', content: JSON.stringify(analysis.businessLogic, null, 2) },
            { type: 'test_cases', title: 'Test Cases', content: JSON.stringify(analysis.testCases, null, 2) },
            { type: 'sequence_diagram', title: 'Sequence Diagram', content: analysis.diagrams?.sequence || '' },
            { type: 'component_diagram', title: 'Component Diagram', content: analysis.diagrams?.component || '' },
            { type: 'architecture_diagram', title: 'Architecture Diagram', content: analysis.diagrams?.architecture || '' },
            { type: 'ui_specification', title: 'UI Specification', content: analysis.uiSpecification || '' },
            { type: 'prd', title: 'Product Requirements Document', content: analysis.prd || '' },
            { type: 'migration_plan', title: 'Migration Plan', content: analysis.migrationPlan || '' }
        ];

        // Clear existing artifacts for this migration
        await prisma.artifact.deleteMany({ where: { migrationId: migration.id } });

        // Create new artifacts
        for (const artifact of artifactTypes) {
            await prisma.artifact.create({
                data: {
                    migrationId: migration.id,
                    type: artifact.type,
                    title: artifact.title,
                    content: artifact.content
                }
            });
        }

        // Update migration status
        await prisma.migration.update({
            where: { id: migration.id },
            data: { status: 'analyzed' }
        });

        // Track LLM usage
        await prisma.llmUsage.create({
            data: {
                migrationId: migration.id,
                stage: 'analyze',
                provider: llmConfig?.provider || 'mock',
                model: llmConfig?.model || 'mock',
                label: llmConfig?.label || 'Mock Data'
            }
        });

        const response = {
            status: 'success',
            report: analysis,
            artifactCount: artifactTypes.length,
            llmUsed: llmConfig ? `${llmConfig.provider}/${llmConfig.model}` : 'mock',
            source
        };
        if (!llmConfig) response.warning = 'No LLM configured for the "Analyze" stage. Showing mock data. Go to Settings to assign an LLM.';
        if (warning) response.warning = warning;
        if (llmError) response.llmError = llmError;

        res.json(response);
    } catch (err) {
        console.error('Analysis error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
