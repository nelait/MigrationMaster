/**
 * Document Service — Chunking, embedding, and similarity search for reference documents
 * Uses pgvector for vector similarity search when embeddings are available.
 * Falls back to including all document content when no embedding API is configured.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Text Chunking ──────────────────────────────────────────────

/**
 * Split text into overlapping chunks suitable for embedding.
 * @param {string} text - The document text
 * @param {number} maxChunkSize - Max characters per chunk (default ~1500 chars ≈ 400 tokens)
 * @param {number} overlap - Overlap between chunks in characters
 * @returns {string[]} Array of text chunks
 */
function chunkDocument(text, maxChunkSize = 1500, overlap = 200) {
    if (!text || text.length <= maxChunkSize) return [text];

    const chunks = [];
    // Try splitting on meaningful boundaries: double newlines, then headings, then single newlines
    const paragraphs = text.split(/\n{2,}/);
    let currentChunk = '';

    for (const para of paragraphs) {
        if (currentChunk.length + para.length + 2 > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            // Keep overlap from end of previous chunk
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = overlapText + '\n\n' + para;
        } else {
            currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
        }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    return chunks;
}

// ─── Embedding Generation ───────────────────────────────────────

/**
 * Generate embeddings for text chunks using OpenAI's embedding API.
 * @param {string[]} chunks - Array of text chunks
 * @param {object} openAIConfig - { apiKey, model? } for OpenAI embeddings
 * @returns {number[][]|null} Array of embedding vectors, or null if no API key
 */
async function generateEmbeddings(chunks, openAIConfig) {
    if (!openAIConfig?.apiKey) return null;

    const model = openAIConfig.embeddingModel || 'text-embedding-3-small';

    try {
        const res = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIConfig.apiKey}`
            },
            body: JSON.stringify({
                model,
                input: chunks
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn('Embedding API error:', err.error?.message || res.statusText);
            return null;
        }

        const data = await res.json();
        // Sort by index to ensure correct ordering
        return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
    } catch (err) {
        console.warn('Embedding generation failed:', err.message);
        return null;
    }
}

/**
 * Generate a single embedding for a query string.
 */
async function generateQueryEmbedding(query, openAIConfig) {
    const embeddings = await generateEmbeddings([query], openAIConfig);
    return embeddings ? embeddings[0] : null;
}

// ─── Document Storage ───────────────────────────────────────────

/**
 * Process and store a document: chunk it, generate embeddings, save to DB.
 * @param {string} userId
 * @param {string} name - Document name
 * @param {string} type - Document type (coding_standards, db_schema, etc.)
 * @param {string} content - Full document text
 * @returns {object} The created ReferenceDocument with chunk count
 */
async function processAndStoreDocument(userId, name, type, content) {
    // Create the document record
    const doc = await prisma.referenceDocument.create({
        data: { userId, name, type, content }
    });

    // Chunk the content
    const chunks = chunkDocument(content);

    // Try to get OpenAI config for embeddings
    const openAIConfig = await getOpenAIConfig(userId);
    const embeddings = await generateEmbeddings(chunks, openAIConfig);

    // Store chunks (with or without embeddings)
    for (let i = 0; i < chunks.length; i++) {
        if (embeddings && embeddings[i]) {
            // Use raw SQL for vector insertion since Prisma doesn't natively support vector type
            const embeddingStr = `[${embeddings[i].join(',')}]`;
            await prisma.$executeRawUnsafe(
                `INSERT INTO "DocumentChunk" (id, "documentId", "chunkIndex", content, embedding, "createdAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())`,
                doc.id, i, chunks[i], embeddingStr
            );
        } else {
            // No embedding — store chunk without vector
            await prisma.documentChunk.create({
                data: {
                    documentId: doc.id,
                    chunkIndex: i,
                    content: chunks[i]
                }
            });
        }
    }

    return { ...doc, chunkCount: chunks.length, hasEmbeddings: !!embeddings };
}

// ─── Similarity Search ──────────────────────────────────────────

/**
 * Search for relevant document chunks using vector similarity.
 * Falls back to returning all chunks if no embeddings are available.
 * @param {string} query - Search query
 * @param {string} userId - User ID to scope the search
 * @param {number} topK - Number of results to return
 * @returns {object[]} Array of { content, documentName, documentType, similarity }
 */
async function searchRelevantChunks(query, userId, topK = 10) {
    const openAIConfig = await getOpenAIConfig(userId);
    const queryEmbedding = await generateQueryEmbedding(query, openAIConfig);

    if (queryEmbedding) {
        // Vector similarity search using pgvector cosine distance
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        const results = await prisma.$queryRawUnsafe(`
            SELECT dc.content, dc."chunkIndex",
                   rd.name as "documentName", rd.type as "documentType",
                   1 - (dc.embedding <=> $1::vector) as similarity
            FROM "DocumentChunk" dc
            JOIN "ReferenceDocument" rd ON dc."documentId" = rd.id
            WHERE rd."userId" = $2
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> $1::vector
            LIMIT $3
        `, embeddingStr, userId, topK);

        return results;
    }

    // Fallback: return all chunks for the user's documents (no vector search)
    const allChunks = await prisma.$queryRawUnsafe(`
        SELECT dc.content, dc."chunkIndex",
               rd.name as "documentName", rd.type as "documentType",
               1.0 as similarity
        FROM "DocumentChunk" dc
        JOIN "ReferenceDocument" rd ON dc."documentId" = rd.id
        WHERE rd."userId" = $1
        ORDER BY rd."createdAt" DESC, dc."chunkIndex" ASC
        LIMIT $2
    `, userId, topK);

    return allChunks;
}

/**
 * Get relevant reference context for a migration's code generation.
 * Builds a query from the migration's file contents and artifact summaries,
 * then retrieves the most relevant document chunks.
 * @param {object[]} files - Migration files
 * @param {string} userId - User ID
 * @returns {string} Formatted reference context string for injection into prompts
 */
async function getRelevantContext(files, userId) {
    // Check if user has any reference documents
    const docCount = await prisma.referenceDocument.count({ where: { userId } });
    if (docCount === 0) return '';

    // Build a query from file content keywords
    const fileNames = files.map(f => f.filename).join(', ');
    const query = `Migration context: files ${fileNames}. Code patterns, database schema, coding standards, API specifications.`;

    const chunks = await searchRelevantChunks(query, userId, 15);
    if (chunks.length === 0) return '';

    // Format chunks grouped by document
    const grouped = {};
    for (const chunk of chunks) {
        const key = `${chunk.documentName} (${chunk.documentType})`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(chunk.content);
    }

    let context = '## Reference Documents (User-Provided Context)\n';
    context += 'The following reference materials were uploaded by the user. Follow these guidelines strictly:\n\n';
    for (const [docName, contents] of Object.entries(grouped)) {
        context += `### ${docName}\n${contents.join('\n\n---\n\n')}\n\n`;
    }

    return context;
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Get OpenAI API key from user's LLM configs (for embedding generation).
 */
async function getOpenAIConfig(userId) {
    const configs = await prisma.llmConfig.findMany({
        where: { userId, provider: 'openai' }
    });
    if (configs.length === 0) return null;
    // Use the first OpenAI config that has an API key
    const config = configs.find(c => c.apiKey) || null;
    return config ? { apiKey: config.apiKey } : null;
}

module.exports = {
    chunkDocument,
    generateEmbeddings,
    processAndStoreDocument,
    searchRelevantChunks,
    getRelevantContext
};
