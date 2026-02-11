const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/migration-paths
router.get('/migration-paths', authMiddleware, (req, res) => {
    res.json({
        paths: [
            {
                id: 'php-to-react',
                name: 'PHP to React',
                source: 'PHP',
                target: 'React',
                description: 'Migrate PHP applications to modern React with hooks and functional components',
                icon: '⚛️',
                status: 'available'
            },
            {
                id: 'java-to-node',
                name: 'Java to Node.js',
                source: 'Java',
                target: 'Node.js',
                description: 'Migrate Java backend services to Node.js',
                icon: '🟢',
                status: 'coming_soon'
            },
            {
                id: 'angular-to-react',
                name: 'Angular to React',
                source: 'Angular',
                target: 'React',
                description: 'Migrate Angular applications to React',
                icon: '🔄',
                status: 'coming_soon'
            }
        ]
    });
});

// POST /api/migrations — create a new migration session
router.post('/migrations', authMiddleware, async (req, res) => {
    try {
        const { selectedPath, name } = req.body;
        if (!selectedPath) {
            return res.status(400).json({ error: 'Selected path is required' });
        }

        const migration = await prisma.migration.create({
            data: {
                userId: req.user.userId,
                name: name?.trim() || null,
                selectedPath,
                status: 'created'
            }
        });

        res.status(201).json(migration);
    } catch (err) {
        console.error('Create migration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/migrations — list user's migrations
router.get('/migrations', authMiddleware, async (req, res) => {
    try {
        const migrations = await prisma.migration.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                files: { select: { id: true, filename: true } },
                artifacts: { select: { id: true, type: true, title: true } },
                _count: { select: { files: true, artifacts: true } }
            }
        });
        res.json(migrations);
    } catch (err) {
        console.error('List migrations error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/migrations/:id — get migration details
router.get('/migrations/:id', authMiddleware, async (req, res) => {
    try {
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
            include: {
                files: true,
                artifacts: true,
                generatedCode: true,
                evaluations: true,
                llmUsages: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        res.json(migration);
    } catch (err) {
        console.error('Get migration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
