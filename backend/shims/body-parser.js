// Cloudflare Workers shim.
// Express eagerly reads body-parser.json, which loads raw-body -> iconv-lite.
// iconv-lite calls a Node stream helper that is disabled in Workers.
// server.js parses request bodies itself, so these parsers are unused.
const noop = (req, res, next) => next();
const parser = () => noop;

module.exports = parser;
module.exports.json = parser;
module.exports.urlencoded = parser;
module.exports.raw = parser;
module.exports.text = parser;
