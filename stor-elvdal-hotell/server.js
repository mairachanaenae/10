const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const defaultPort = Number(process.env.PORT) || 3000;
let port = defaultPort;
let host = process.env.HOST || '0.0.0.0';

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if ((arg === '--port' || arg === '-p') && process.argv[index + 1]) {
    port = Number(process.argv[index + 1]) || port;
    index += 1;
  } else if (arg.startsWith('--port=')) {
    port = Number(arg.split('=')[1]) || port;
  } else if ((arg === '--host' || arg === '-h') && process.argv[index + 1]) {
    host = process.argv[index + 1];
    index += 1;
  } else if (arg.startsWith('--host=')) {
    host = arg.split('=')[1] || host;
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function safePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((request, response) => {
  const filePath = safePath(request.url || '/');

  if (!filePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Stor-Elvdal Hotell preview running at http://${host}:${port}/`);
  console.log(`Copy/paste this local browser URL: http://localhost:${port}/`);
  console.log('In a hosted workspace, use the forwarded-port URL shown by your browser/ports panel.');
});
