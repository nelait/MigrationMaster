const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Mask token for display
function maskToken(token) {
    if (!token || token.length < 8) return '••••••••';
    return token.slice(0, 4) + '••••' + token.slice(-4);
}

// ─── GET /api/settings/github — get user's GitHub config ───
router.get('/settings/github', authMiddleware, async (req, res) => {
    try {
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });
        if (!config) return res.json({ config: null });

        res.json({
            config: {
                ...config,
                token: maskToken(config.token)
            }
        });
    } catch (err) {
        console.error('Error fetching GitHub config:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/settings/github — create or update GitHub config ───
router.post('/settings/github', authMiddleware, async (req, res) => {
    try {
        const { token, owner, repo, branch } = req.body;

        if (!token || !token.trim()) {
            return res.status(400).json({ error: 'Personal Access Token is required' });
        }
        if (!owner || !owner.trim()) {
            return res.status(400).json({ error: 'Owner/Organization is required' });
        }
        if (!repo || !repo.trim()) {
            return res.status(400).json({ error: 'Repository name is required' });
        }

        const existing = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });

        let config;
        if (existing) {
            const data = {
                owner: owner.trim(),
                repo: repo.trim(),
                branch: (branch || 'main').trim()
            };
            // Only update token if a new one was provided (not masked)
            if (!token.includes('••••')) {
                data.token = token.trim();
            }
            config = await prisma.gitHubConfig.update({
                where: { userId: req.user.userId },
                data
            });
        } else {
            config = await prisma.gitHubConfig.create({
                data: {
                    userId: req.user.userId,
                    token: token.trim(),
                    owner: owner.trim(),
                    repo: repo.trim(),
                    branch: (branch || 'main').trim()
                }
            });
        }

        res.json({
            config: {
                ...config,
                token: maskToken(config.token)
            }
        });
    } catch (err) {
        console.error('Error saving GitHub config:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── DELETE /api/settings/github — remove GitHub config ───
router.delete('/settings/github', authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });
        if (!existing) return res.status(404).json({ error: 'No GitHub config found' });

        await prisma.gitHubConfig.delete({ where: { userId: req.user.userId } });
        res.json({ status: 'deleted' });
    } catch (err) {
        console.error('Error deleting GitHub config:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/settings/github/test — test connection ───
router.post('/settings/github/test', authMiddleware, async (req, res) => {
    try {
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });
        if (!config) return res.status(400).json({ error: 'No GitHub config found. Save your settings first.' });

        // Test by fetching the authenticated user
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!userRes.ok) {
            const errData = await userRes.json().catch(() => ({}));
            return res.status(400).json({
                status: 'error',
                message: errData.message || `GitHub API returned ${userRes.status}`
            });
        }

        const userData = await userRes.json();

        // Also verify repo access
        const repoRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!repoRes.ok) {
            return res.status(400).json({
                status: 'error',
                message: `Authenticated as ${userData.login}, but cannot access repo ${config.owner}/${config.repo}`
            });
        }

        res.json({
            status: 'success',
            message: `Connected as ${userData.login} • Repo ${config.owner}/${config.repo} accessible`,
            user: userData.login
        });
    } catch (err) {
        console.error('GitHub test error:', err);
        res.status(400).json({ status: 'error', message: err.message || 'Connection failed' });
    }
});

// ─── Scaffold files for a complete Vite + React project ───
function getScaffoldFiles(repoName, generatedFiles) {
    // Detect which imports App.jsx uses so we can include the right deps
    const appFile = generatedFiles.find(f => f.filename === 'src/App.jsx' || f.filename === '/src/App.jsx');
    const allContent = generatedFiles.map(f => f.content).join('\n');
    const usesRouter = allContent.includes('react-router-dom');
    const usesAxios = allContent.includes('axios');

    const deps = {
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
    };
    if (usesRouter) deps["react-router-dom"] = "^6.28.0";
    if (usesAxios) deps["axios"] = "^1.7.0";

    return [
        {
            filename: 'package.json',
            content: JSON.stringify({
                name: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                private: true,
                version: "1.0.0",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "vite build",
                    preview: "vite preview"
                },
                dependencies: deps,
                devDependencies: {
                    "@vitejs/plugin-react": "^4.3.4",
                    "vite": "^6.0.0"
                }
            }, null, 2) + '\n'
        },
        {
            filename: 'vite.config.js',
            content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
`
        },
        {
            filename: 'index.html',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${repoName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
        },
        {
            filename: 'src/main.jsx',
            content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`
        },
        {
            filename: 'src/index.css',
            content: `/* ── Base Styles ── */
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #ffffff;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
}

a {
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}
`
        },
        {
            filename: '.gitignore',
            content: `node_modules
dist
dist-ssr
*.local
.env
.env.*
!.env.example
`
        },
        {
            filename: 'README.md',
            content: `# ${repoName}

React application generated by [MigrationMaster](https://github.com) from PHP source code.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`
`
        }
    ];
}

// ─── POST /api/migrations/:id/push-github — push generated code to GitHub ───
router.post('/migrations/:id/push-github', authMiddleware, async (req, res) => {
    try {
        const { owner: overrideOwner, repo: overrideRepo, branch: overrideBranch } = req.body || {};

        // Load user's GitHub config
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });
        if (!config) {
            return res.status(400).json({
                error: 'No GitHub connection configured. Go to Settings → GitHub Connection to set it up.'
            });
        }

        const owner = (overrideOwner || config.owner).trim();
        const repo = (overrideRepo || config.repo).trim();
        const branch = (overrideBranch || config.branch).trim();

        // Verify migration belongs to user
        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        // Load generated code
        const generatedCode = await prisma.generatedCode.findMany({
            where: { migrationId: req.params.id }
        });
        if (generatedCode.length === 0) {
            return res.status(400).json({ error: 'No generated code to push. Generate code first.' });
        }

        // ── Build the complete file list: scaffold + generated code ──
        const scaffoldFiles = getScaffoldFiles(repo, generatedCode);

        // Merge: generated code files take priority over scaffold files
        const generatedPaths = new Set(
            generatedCode.map(f => f.filename.startsWith('/') ? f.filename.slice(1) : f.filename)
        );
        const allFiles = [
            ...scaffoldFiles.filter(s => !generatedPaths.has(s.filename)),
            ...generatedCode.map(f => ({
                filename: f.filename.startsWith('/') ? f.filename.slice(1) : f.filename,
                content: f.content
            }))
        ];

        const ghHeaders = {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
        };

        const results = [];

        for (const file of allFiles) {
            const filePath = file.filename;
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

            // Check if file already exists (to get SHA for updates)
            let sha = undefined;
            const existingRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
            if (existingRes.ok) {
                const existingData = await existingRes.json();
                sha = existingData.sha;
            }

            // Create or update the file
            const body = {
                message: `Migration: ${migration.selectedPath} — ${sha ? 'update' : 'add'} ${filePath}`,
                content: Buffer.from(file.content).toString('base64'),
                branch
            };
            if (sha) body.sha = sha;

            const pushRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: ghHeaders,
                body: JSON.stringify(body)
            });

            if (!pushRes.ok) {
                const errData = await pushRes.json().catch(() => ({}));
                results.push({
                    file: filePath,
                    status: 'error',
                    message: errData.message || `HTTP ${pushRes.status}`
                });
            } else {
                results.push({ file: filePath, status: 'success' });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        res.json({
            status: errorCount === 0 ? 'success' : 'partial',
            message: `Pushed ${successCount}/${allFiles.length} files to ${owner}/${repo} (${branch})`,
            repoUrl: `https://github.com/${owner}/${repo}/tree/${branch}`,
            results
        });
    } catch (err) {
        console.error('GitHub push error:', err);
        res.status(500).json({ error: err.message || 'Failed to push to GitHub' });
    }
});

// ─── GET /api/github/repos — list user's accessible repos ───
router.get('/github/repos', authMiddleware, async (req, res) => {
    try {
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });
        if (!config?.token) {
            return res.status(400).json({ error: 'No GitHub token configured. Go to Settings to connect GitHub.' });
        }

        const headers = {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        // Fetch repos the user has access to (up to 100, sorted by push date)
        const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member', { headers });
        if (!reposRes.ok) {
            const err = await reposRes.json().catch(() => ({}));
            return res.status(reposRes.status).json({ error: err.message || 'Failed to fetch repos' });
        }
        const repos = await reposRes.json();

        res.json({
            repos: repos.map(r => ({
                full_name: r.full_name,
                name: r.name,
                owner: r.owner.login,
                private: r.private,
                default_branch: r.default_branch,
                description: r.description,
                pushed_at: r.pushed_at
            }))
        });
    } catch (err) {
        console.error('GitHub repos error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch repositories' });
    }
});

// ─── GET /api/github/repos/:owner/:repo/branches — list branches ───
router.get('/github/repos/:owner/:repo/branches', authMiddleware, async (req, res) => {
    try {
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });
        if (!config?.token) {
            return res.status(400).json({ error: 'No GitHub token configured.' });
        }

        const { owner, repo } = req.params;
        const headers = {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers });
        if (!branchRes.ok) {
            const err = await branchRes.json().catch(() => ({}));
            return res.status(branchRes.status).json({ error: err.message || 'Failed to fetch branches' });
        }
        const branches = await branchRes.json();

        res.json({
            branches: branches.map(b => ({ name: b.name, protected: b.protected }))
        });
    } catch (err) {
        console.error('GitHub branches error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch branches' });
    }
});

// ─── Helper: parse GitHub URL into owner/repo/branch/path ───
function parseGitHubUrl(url) {
    // Supports:
    //   https://github.com/owner/repo
    //   https://github.com/owner/repo/tree/branch
    //   https://github.com/owner/repo/tree/branch/sub/dir
    const cleaned = url.replace(/\/+$/, '').replace(/\.git$/, '');
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?/);
    if (!match) return null;
    return {
        owner: match[1],
        repo: match[2],
        branch: match[3] || 'main',
        subpath: match[4] || ''
    };
}

// ─── Helper: build nested tree from flat GitHub tree response ───
function buildNestedTree(flatTree, subpath) {
    const root = { name: '', type: 'dir', children: [], path: '' };
    const prefix = subpath ? subpath + '/' : '';

    for (const item of flatTree) {
        // Filter by subpath if specified
        if (prefix && !item.path.startsWith(prefix)) continue;

        const relativePath = prefix ? item.path.slice(prefix.length) : item.path;
        if (!relativePath) continue;

        const parts = relativePath.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const name = parts[i];
            const isLast = i === parts.length - 1;

            let child = current.children.find(c => c.name === name);
            if (!child) {
                child = {
                    name,
                    path: item.path,
                    type: isLast ? (item.type === 'tree' ? 'dir' : 'file') : 'dir',
                    size: isLast && item.type !== 'tree' ? item.size : undefined,
                    children: []
                };
                current.children.push(child);
            }
            current = child;
        }
    }

    // Sort: dirs first, then files, alphabetically
    function sortTree(node) {
        node.children.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
    }
    sortTree(root);
    return root.children;
}

// ─── POST /api/migrations/:id/github-tree — fetch repo file tree ───
router.post('/migrations/:id/github-tree', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.trim()) {
            return res.status(400).json({ error: 'GitHub URL is required' });
        }

        const parsed = parseGitHubUrl(url.trim());
        if (!parsed) {
            return res.status(400).json({ error: 'Invalid GitHub URL. Expected format: https://github.com/owner/repo' });
        }

        // Get user's token if available (for private repos)
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });

        const headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (config?.token) headers['Authorization'] = `Bearer ${config.token}`;

        // Fetch recursive tree
        const treeRes = await fetch(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${parsed.branch}?recursive=1`,
            { headers }
        );

        if (!treeRes.ok) {
            const errData = await treeRes.json().catch(() => ({}));
            return res.status(treeRes.status === 404 ? 404 : 400).json({
                error: errData.message || `GitHub API returned ${treeRes.status}. Is the repo public or do you have a token configured in Settings?`
            });
        }

        const treeData = await treeRes.json();
        const nestedTree = buildNestedTree(treeData.tree, parsed.subpath);

        res.json({
            owner: parsed.owner,
            repo: parsed.repo,
            branch: parsed.branch,
            subpath: parsed.subpath,
            tree: nestedTree,
            totalFiles: treeData.tree.filter(t => t.type === 'blob').length
        });
    } catch (err) {
        console.error('GitHub tree error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch repository tree' });
    }
});

// ─── POST /api/migrations/:id/github-import — import selected files ───
router.post('/migrations/:id/github-import', authMiddleware, async (req, res) => {
    try {
        const { files, owner, repo, branch } = req.body;
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ error: 'No files selected for import' });
        }
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Owner and repo are required' });
        }

        const migration = await prisma.migration.findFirst({
            where: { id: req.params.id, userId: req.user.userId }
        });
        if (!migration) {
            return res.status(404).json({ error: 'Migration not found' });
        }

        // Get user's token if available
        const config = await prisma.gitHubConfig.findUnique({
            where: { userId: req.user.userId }
        });

        const headers = {
            'Accept': 'application/vnd.github.v3.raw',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (config?.token) headers['Authorization'] = `Bearer ${config.token}`;

        const imported = [];
        const errors = [];

        for (const filePath of files) {
            try {
                const contentRes = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch || 'main'}`,
                    { headers }
                );
                if (!contentRes.ok) {
                    errors.push({ file: filePath, error: `HTTP ${contentRes.status}` });
                    continue;
                }
                const content = await contentRes.text();

                const dbFile = await prisma.uploadedFile.create({
                    data: {
                        migrationId: migration.id,
                        filename: filePath,
                        content
                    }
                });
                imported.push({ id: dbFile.id, filename: dbFile.filename });
            } catch (err) {
                errors.push({ file: filePath, error: err.message });
            }
        }

        // Update migration status
        if (imported.length > 0) {
            await prisma.migration.update({
                where: { id: migration.id },
                data: { status: 'files_uploaded' }
            });
        }

        res.json({
            status: errors.length === 0 ? 'success' : 'partial',
            imported,
            errors,
            message: `Imported ${imported.length}/${files.length} files from ${owner}/${repo}`
        });
    } catch (err) {
        console.error('GitHub import error:', err);
        res.status(500).json({ error: err.message || 'Failed to import files' });
    }
});

module.exports = router;
