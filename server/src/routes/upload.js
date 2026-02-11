const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.php', '.inc', '.phtml', '.php3', '.php4', '.php5'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PHP files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/migrations/:id/upload
router.post('/migrations/:id/upload', authMiddleware, upload.array('files', 50), async (req, res) => {
    try {
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });

        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        const uploadedFiles = [];
        for (const file of req.files) {
            const content = fs.readFileSync(file.path, 'utf-8');
            const dbFile = await prisma.uploadedFile.create({
                data: {
                    migrationId: migration.id,
                    filename: file.originalname,
                    content
                }
            });
            uploadedFiles.push(dbFile);
        }

        // Update migration status
        await prisma.migration.update({
            where: { id: migration.id },
            data: { status: 'files_uploaded' }
        });

        res.json({
            status: 'success',
            files: uploadedFiles.map(f => ({ id: f.id, filename: f.filename }))
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

module.exports = router;
