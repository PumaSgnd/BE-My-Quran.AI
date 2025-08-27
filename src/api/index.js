// src/api/index.js
const serverless = require('serverless-http');
const app = require('../index');

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};
