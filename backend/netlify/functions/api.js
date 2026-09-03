const serverless = require("serverless-http");
const app = require("../../src/app");

// Netlify invokes this handler for every /api/* request. The Express app is
// imported without calling app.listen(), which remains local-development only.
module.exports.handler = serverless(app);
