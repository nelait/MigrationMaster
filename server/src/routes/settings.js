const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Mask API key for display
function maskKey(key) {
    if (!key || key.length < 8) return '••••••••';
    return key.slice(0, 4) + '••••' + key.slice(-4);
}

// Supported providers and their default models
const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        icon: '🟢',
        models: [
            'o3-mini',
            'o3',
            'o1',
            'o1-mini',
            'gpt-4.1',
            'gpt-4.1-mini',
            'gpt-4.1-nano',
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
        ],
        defaultModel: 'gpt-4.1-mini',
        requiresKey: true
    },
    anthropic: {
        name: 'Anthropic',
        icon: '🟠',
        models: [
            'claude-opus-4-0-20250514',
            'claude-sonnet-4-20250514',
            'claude-3-7-sonnet-20250219',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-haiku-20240307',
        ],
        defaultModel: 'claude-sonnet-4-20250514',
        requiresKey: true
    },
    google: {
        name: 'Google AI',
        icon: '🔵',
        models: [
            'gemini-2.5-pro-preview-06-05',
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
        ],
        defaultModel: 'gemini-2.5-flash-preview-05-20',
        requiresKey: true
    },
    ollama: {
        name: 'Ollama (Local)',
        icon: '🦙',
        models: ['llama3.3', 'llama3.1', 'codellama', 'mistral', 'mixtral', 'phi4', 'qwen2.5-coder', 'deepseek-coder-v2'],
        defaultModel: 'llama3.3',
        requiresKey: false
    }
};

// GET /api/settings/providers — list supported providers
router.get('/settings/providers', authMiddleware, (req, res) => {
    res.json({ providers: PROVIDERS });
});

// GET /api/settings/llm — list user's LLM configs
router.get('/settings/llm', authMiddleware, async (req, res) => {
    try {
        const configs = await prisma.llmConfig.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });

        const masked = configs.map(c => ({
            ...c,
            apiKey: maskKey(c.apiKey),
            providerInfo: PROVIDERS[c.provider] || {}
        }));

        res.json({ configs: masked });
    } catch (err) {
        console.error('Error listing LLM configs:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings/llm — add new LLM config
router.post('/settings/llm', authMiddleware, async (req, res) => {
    try {
        const { provider, label, apiKey, model, baseUrl } = req.body;

        if (!provider || !PROVIDERS[provider]) {
            return res.status(400).json({ error: 'Invalid provider. Must be one of: ' + Object.keys(PROVIDERS).join(', ') });
        }
        if (!label || !label.trim()) {
            return res.status(400).json({ error: 'Label is required' });
        }
        if (PROVIDERS[provider].requiresKey && (!apiKey || !apiKey.trim())) {
            return res.status(400).json({ error: 'API key is required for ' + PROVIDERS[provider].name });
        }

        const config = await prisma.llmConfig.create({
            data: {
                userId: req.user.userId,
                provider,
                label: label.trim(),
                apiKey: apiKey || '',
                model: model || PROVIDERS[provider].defaultModel,
                baseUrl: baseUrl || '',
                activeFor: ''
            }
        });

        res.json({
            ...config,
            apiKey: maskKey(config.apiKey),
            providerInfo: PROVIDERS[provider]
        });
    } catch (err) {
        console.error('Error creating LLM config:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/settings/llm/:id — update config
router.put('/settings/llm/:id', authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.llmConfig.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!existing) return res.status(404).json({ error: 'Config not found' });

        const { label, apiKey, model, baseUrl } = req.body;
        const data = {};
        if (label !== undefined) data.label = label.trim();
        if (apiKey !== undefined && apiKey !== '') data.apiKey = apiKey;
        if (model !== undefined) data.model = model;
        if (baseUrl !== undefined) data.baseUrl = baseUrl;

        const updated = await prisma.llmConfig.update({
            where: { id: req.params.id },
            data
        });

        res.json({ ...updated, apiKey: maskKey(updated.apiKey) });
    } catch (err) {
        console.error('Error updating LLM config:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/settings/llm/:id — delete config
router.delete('/settings/llm/:id', authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.llmConfig.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!existing) return res.status(404).json({ error: 'Config not found' });

        await prisma.llmConfig.delete({ where: { id: req.params.id } });

        // If deleted had stages, they are simply freed
        if (existing.activeFor) {
            // Stages are now unassigned; user can reassign them
            const next = await prisma.llmConfig.findFirst({
                where: { userId: req.user.userId },
                orderBy: { createdAt: 'desc' }
            });
            if (next) {
                await prisma.llmConfig.update({
                    where: { id: next.id },
                    data: { activeFor: existing.activeFor }
                });
            }
        }

        res.json({ status: 'deleted' });
    } catch (err) {
        console.error('Error deleting LLM config:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/settings/llm/:id/stages — assign stages to this config
router.put('/settings/llm/:id/stages', authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.llmConfig.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!existing) return res.status(404).json({ error: 'Config not found' });

        const { stages } = req.body; // e.g. ['analyze', 'generate']
        const validStages = ['analyze', 'generate', 'evaluate'];
        const requestedStages = (stages || []).filter(s => validStages.includes(s));

        // Remove these stages from all other user configs
        if (requestedStages.length > 0) {
            const allConfigs = await prisma.llmConfig.findMany({
                where: { userId: req.user.userId }
            });
            for (const cfg of allConfigs) {
                if (cfg.id === req.params.id) continue;
                const currentStages = cfg.activeFor ? cfg.activeFor.split(',').filter(Boolean) : [];
                const filtered = currentStages.filter(s => !requestedStages.includes(s));
                if (filtered.length !== currentStages.length) {
                    await prisma.llmConfig.update({
                        where: { id: cfg.id },
                        data: { activeFor: filtered.join(',') }
                    });
                }
            }
        }

        // Set stages on this config
        const updated = await prisma.llmConfig.update({
            where: { id: req.params.id },
            data: { activeFor: requestedStages.join(',') }
        });

        res.json({ ...updated, apiKey: maskKey(updated.apiKey) });
    } catch (err) {
        console.error('Error setting stages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings/llm/:id/test — test connection
router.post('/settings/llm/:id/test', authMiddleware, async (req, res) => {
    try {
        const config = await prisma.llmConfig.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!config) return res.status(404).json({ error: 'Config not found' });

        const { callLLM } = require('../services/llmService');

        const result = await callLLM(config, 'Respond with exactly: {"status":"ok","message":"Connection successful"}');

        res.json({ status: 'success', message: 'Connection successful', response: result });
    } catch (err) {
        console.error('LLM test error:', err);
        res.status(400).json({ status: 'error', message: err.message || 'Connection failed' });
    }
});

module.exports = router;
