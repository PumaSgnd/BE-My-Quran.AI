// // src/api/index.js
// const serverless = require('serverless-http');
// const app = require('../index');
// const handler = serverless(app);

// module.exports = (req, res) => handler(req, res);

// src/api/index.js
const app = require('../index');

// Vercel Serverless Functions bisa langsung consume Express app
module.exports = app;