const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, userId: user.id, username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, passwordHash }
        });

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, userId: user.id, username: user.username });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
