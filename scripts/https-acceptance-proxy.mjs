import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const [pfxPath, passphrase, port = "3443", backend = "http://127.0.0.1:3100"] = process.argv.slice(2);
const target = new URL(backend);
const server = https.createServer({ pfx: fs.readFileSync(pfxPath), passphrase }, (request, response) => {
  const upstream = http.request({ hostname: target.hostname, port: target.port, path: request.url, method: request.method, headers: { ...request.headers, host: request.headers.host, "x-forwarded-host": request.headers.host, "x-forwarded-proto": "https" } }, (result) => {
    response.writeHead(result.statusCode ?? 502, result.headers);
    result.pipe(response);
  });
  upstream.on("error", () => { if (!response.headersSent) response.writeHead(502); response.end("Proxy unavailable"); });
  request.pipe(upstream);
});
server.listen(Number(port), "127.0.0.1");
