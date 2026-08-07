// Vercel serverless entrypoint.
// server.js exports the Express app; this wrapper brings it into the Vercel
// Node runtime as the request handler.
const app = require('../server');

module.exports = app;