const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const migrationRoutes = require('./routes/migrations');
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');
const artifactRoutes = require('./routes/artifacts');
const generateRoutes = require('./routes/generate');
const evaluationRoutes = require('./routes/evaluation');
const settingsRoutes = require('./routes/settings');
const githubRoutes = require('./routes/github');
const documentRoutes = require('./routes/documents');

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', authRoutes);
app.use('/api', migrationRoutes);
app.use('/api', uploadRoutes);
app.use('/api', analysisRoutes);
app.use('/api', artifactRoutes);
app.use('/api', generateRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', settingsRoutes);
app.use('/api', githubRoutes);
app.use('/api', documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 mAIgration MastEr server running on http://localhost:${PORT}`);
});
