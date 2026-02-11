const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { processAndStoreDocument } = require('../services/documentService');

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/reference-docs');
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
        const allowed = ['.txt', '.md', '.sql', '.json', '.yaml', '.yml', '.csv', '.xml', '.prisma', '.graphql', '.ts', '.js', '.py', '.java', '.rb', '.go', '.rs', '.env'];
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not supported. Allowed: ${allowed.join(', ')}`), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB per file
});

// POST /api/documents/upload — upload reference documents
router.post('/documents/upload', authMiddleware, upload.array('files', 10), async (req, res) => {
    try {
        const { type } = req.body;
        const docType = type || 'other';

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const results = [];
        for (const file of req.files) {
            const content = fs.readFileSync(file.path, 'utf-8');
            const doc = await processAndStoreDocument(
                req.user.userId,
                file.originalname,
                docType,
                content
            );
            results.push({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                chunkCount: doc.chunkCount,
                hasEmbeddings: doc.hasEmbeddings
            });
        }

        res.json({ status: 'success', documents: results });
    } catch (err) {
        console.error('Document upload error:', err);
        res.status(500).json({ error: err.message || 'Failed to upload documents' });
    }
});

// GET /api/documents — list user's reference documents
router.get('/documents', authMiddleware, async (req, res) => {
    try {
        const documents = await prisma.referenceDocument.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { chunks: true } }
            }
        });

        // Check if any chunks have embeddings
        const docsWithInfo = await Promise.all(documents.map(async (doc) => {
            const embeddingCount = await prisma.$queryRawUnsafe(
                `SELECT COUNT(*) as count FROM "DocumentChunk" WHERE "documentId" = $1 AND embedding IS NOT NULL`,
                doc.id
            );
            return {
                id: doc.id,
                name: doc.name,
                type: doc.type,
                chunkCount: doc._count.chunks,
                hasEmbeddings: Number(embeddingCount[0]?.count || 0) > 0,
                createdAt: doc.createdAt,
                contentPreview: doc.content.slice(0, 200) + (doc.content.length > 200 ? '...' : '')
            };
        }));

        res.json(docsWithInfo);
    } catch (err) {
        console.error('List documents error:', err);
        res.status(500).json({ error: err.message || 'Failed to list documents' });
    }
});

// DELETE /api/documents/:id — remove a document and its chunks
router.delete('/documents/:id', authMiddleware, async (req, res) => {
    try {
        const doc = await prisma.referenceDocument.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Cascade delete will remove chunks too (defined in schema)
        await prisma.referenceDocument.delete({ where: { id: doc.id } });

        res.json({ status: 'success', message: 'Document deleted' });
    } catch (err) {
        console.error('Delete document error:', err);
        res.status(500).json({ error: err.message || 'Failed to delete document' });
    }
});

// GET /api/documents/:id/chunks — view document chunks (debug)
router.get('/documents/:id/chunks', authMiddleware, async (req, res) => {
    try {
        const doc = await prisma.referenceDocument.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const chunks = await prisma.documentChunk.findMany({
            where: { documentId: doc.id },
            orderBy: { chunkIndex: 'asc' },
            select: { id: true, chunkIndex: true, content: true, createdAt: true }
        });

        res.json({ document: { id: doc.id, name: doc.name, type: doc.type }, chunks });
    } catch (err) {
        console.error('Get chunks error:', err);
        res.status(500).json({ error: err.message || 'Failed to get chunks' });
    }
});

module.exports = router;
