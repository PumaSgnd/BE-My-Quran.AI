// src/api/index.js
const serverless = require('serverless-http');
const app = require('../index');
const handler = serverless(app);

module.exports = (req, res) => handler(req, res);
