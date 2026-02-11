const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { generateCode } = require('../services/llmService');
const { getRelevantContext } = require('../services/documentService');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/migrations/:id/generate-code
router.post('/migrations/:id/generate-code', authMiddleware, async (req, res) => {
    try {
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
            include: { files: true, artifacts: true }
        });

        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        if (migration.artifacts.length === 0) {
            return res.status(400).json({ error: 'Please analyze the code first before generating.' });
        }

        // Get LLM config assigned to the 'generate' stage
        const allConfigs = await prisma.llmConfig.findMany({
            where: { userId: req.user.userId }
        });
        const llmConfig = allConfigs.find(c => c.activeFor && c.activeFor.split(',').includes('generate')) || null;

        // Generate code (real LLM or mock)
        let result;
        let warning = null;
        let llmError = null;
        let source = 'llm';

        try {
            // Fetch reference document context for the user
            const referenceContext = await getRelevantContext(migration.files, req.user.userId);

            result = await generateCode(migration.files, migration.artifacts, llmConfig, referenceContext);
            if (!llmConfig) source = 'mock';
        } catch (err) {
            console.error('LLM generation failed, falling back to mock:', err.message);
            const { generateReactCode, generateTestCases } = require('../services/mockLLM');
            result = { files: generateReactCode(migration.files, migration.artifacts), testCode: generateTestCases(migration.files) };
            source = 'mock';
            llmError = err.message;
            warning = `LLM call failed (${llmConfig?.label || llmConfig?.provider}): ${err.message}. Showing mock data instead.`;
        }

        const generatedFiles = result.files;
        const testCode = result.testCode;

        // Clear existing generated code
        await prisma.generatedCode.deleteMany({ where: { migrationId: migration.id } });

        // Store generated code
        for (const file of generatedFiles) {
            await prisma.generatedCode.create({
                data: {
                    migrationId: migration.id,
                    filename: file.filename,
                    content: file.content,
                    explanation: file.explanation || ''
                }
            });
        }

        // Store test cases
        await prisma.generatedCode.create({
            data: {
                migrationId: migration.id,
                filename: 'src/__tests__/App.test.jsx',
                content: typeof testCode === 'string' ? testCode : JSON.stringify(testCode),
                explanation: 'Auto-generated test suite covering authentication, routing, data loading, and form validation.'
            }
        });

        // Update migration status
        await prisma.migration.update({
            where: { id: migration.id },
            data: { status: 'code_generated' }
        });

        // Track LLM usage
        await prisma.llmUsage.create({
            data: {
                migrationId: migration.id,
                stage: 'generate',
                provider: llmConfig?.provider || 'mock',
                model: llmConfig?.model || 'mock',
                label: llmConfig?.label || 'Mock Data'
            }
        });

        const response = {
            status: 'success',
            files: [...generatedFiles, { filename: 'src/__tests__/App.test.jsx', content: testCode, explanation: 'Auto-generated test suite' }],
            llmUsed: llmConfig ? `${llmConfig.provider}/${llmConfig.model}` : 'mock',
            source
        };
        if (!llmConfig) response.warning = 'No LLM configured for the "Generate" stage. Showing mock data. Go to Settings to assign an LLM.';
        if (warning) response.warning = warning;
        if (llmError) response.llmError = llmError;

        res.json(response);
    } catch (err) {
        console.error('Code generation error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
