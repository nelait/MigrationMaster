const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/migrations/:id/artifacts
router.get('/migrations/:id/artifacts', authMiddleware, async (req, res) => {
    try {
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });

        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        const artifacts = await prisma.artifact.findMany({
            where: { migrationId: migration.id },
            orderBy: { createdAt: 'asc' }
        });

        res.json(artifacts);
    } catch (err) {
        console.error('List artifacts error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/migrations/:id/artifacts/:artifactId
router.get('/migrations/:id/artifacts/:artifactId', authMiddleware, async (req, res) => {
    try {
        const artifact = await prisma.artifact.findFirst({
            where: { id: req.params.artifactId },
            include: { migration: { select: { userId: true } } }
        });

        if (!artifact || artifact.migration.userId !== req.user.userId) {
            return res.status(404).json({ error: 'Artifact not found' });
        }

        res.json(artifact);
    } catch (err) {
        console.error('Get artifact error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/migrations/:id/artifacts/:artifactId
router.put('/migrations/:id/artifacts/:artifactId', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (content === undefined) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const artifact = await prisma.artifact.findFirst({
            where: { id: req.params.artifactId },
            include: { migration: { select: { userId: true } } }
        });

        if (!artifact || artifact.migration.userId !== req.user.userId) {
            return res.status(404).json({ error: 'Artifact not found' });
        }

        const updated = await prisma.artifact.update({
            where: { id: req.params.artifactId },
            data: { content }
        });

        res.json(updated);
    } catch (err) {
        console.error('Update artifact error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
