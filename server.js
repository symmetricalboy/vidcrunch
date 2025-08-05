const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Read package.json for version info
const packageJson = require('./package.json');

// Set required headers for all responses *before* serving files.
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Disable all caching for development
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  next();
});

// API endpoint to get version
app.get('/api/version', (req, res) => {
  res.json({ version: packageJson.version });
});

// Serve static files from the 'public' directory with no caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: function (res, path) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Route for the root path to serve index.html with no-cache headers
app.get('/', (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for the privacy policy page
app.get('/privacy', (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Catch-all to support SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}); 