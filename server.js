const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Database configuration
const DATABASE_CONFIG = {
  projectId: "67d119b6002dc54d2841",
  databaseId: "67d029ec00097d264cc9",
};

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      process.exit(1);
    })
    .listen(port);
});
