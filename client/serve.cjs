const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const DIST = path.join(__dirname, 'dist');

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
    let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

    // SPA fallback: if file doesn't exist, serve index.html
    if (!fs.existsSync(filePath)) {
        filePath = path.join(DIST, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';

    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (e) {
        res.writeHead(404);
        res.end('Not found');
    }
}).listen(PORT, () => {
    console.log(`Frontend serving at http://localhost:${PORT}/`);
});
