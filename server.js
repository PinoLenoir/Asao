/*
 * server.js
 *
 * A lightweight HTTP server using Node's built‑in modules. This server
 * serves static files from the project directory and implements two
 * endpoints to retrieve and persist attendees for the asado event.
 *
 * No external dependencies are required, making it easy to run on
 * minimal environments. The attendee data is persisted in a local
 * JSON file (attendees.json) located in the same directory.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'attendees.json');

// MIME types for basic static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

/**
 * Load attendees from the JSON file. Returns an empty array if the file
 * does not exist or cannot be parsed. Any errors are silently caught
 * and logged to stderr.
 */
function loadAttendees() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading attendees file:', err);
    return [];
  }
}

/**
 * Save attendees to the JSON file. Writes the JSON in a pretty‑printed
 * format for easier manual editing. Errors are logged but do not
 * prevent the server from responding.
 */
function saveAttendees(attendees) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(attendees, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing attendees file:', err);
  }
}

/**
 * Serve a static file from the project directory. Looks up the file
 * relative to ROOT_DIR and sets an appropriate Content‑Type header. If
 * the file cannot be read, a 404 response is returned.
 */
function serveStatic(res, filepath) {
  const ext = path.extname(filepath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Archivo no encontrado');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
}

/**
 * Parse the body of a request into a string. Returns a promise
 * resolving to the full body. Handles potential chunked requests.
 */
function collectRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

// Load attendees into an in‑memory cache at startup. This cache is used
// to respond to GET requests so that attendee data is preserved in memory
// even if persisting to disk fails (as can happen on some free hosting
// platforms where the filesystem is read‑only).
let attendeesCache = loadAttendees();

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Endpoint: GET /attendees
  if (req.method === 'GET' && pathname === '/attendees') {
    // Return the in‑memory cache rather than reading from disk each time.
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(attendeesCache));
    return;
  }

  // Endpoint: POST /attendees
  if (req.method === 'POST' && pathname === '/attendees') {
    const body = await collectRequestBody(req);
    try {
      const data = JSON.parse(body);
      const name = (data.name || '').trim();
      const comment = (data.comment || '').trim();
      if (!name) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'El nombre es obligatorio' }));
        return;
      }
      // Update the in‑memory cache
      attendeesCache.push({ name, comment, timestamp: new Date().toISOString() });
      // Try to persist to disk; if it fails, attendees will still be
      // available in memory until the server restarts.
      saveAttendees(attendeesCache);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Datos inválidos' }));
      return;
    }
  }

  // Serve static files for other GET requests
  if (req.method === 'GET') {
    // Default file for root path
    let relPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(ROOT_DIR, relPath);
    serveStatic(res, filePath);
    return;
  }

  // Fallback for unsupported methods or paths
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Recurso no encontrado');
});

// Start listening
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});