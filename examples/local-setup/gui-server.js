// Tiny HTTP server pra servir a GUI e abrir o browser.
// Uso:  node gui-server.js   (abre http://localhost:5173 automaticamente)
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.GUI_PORT || 5173);

const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/gui.html") {
    try {
      const html = readFileSync(join(__dirname, "gui.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (e) {
      res.writeHead(500).end("Erro lendo gui.html: " + e.message);
    }
    return;
  }
  res.writeHead(404).end("404");
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Local AI GUI em ${url}`);
  console.log("  Ctrl+C pra parar.\n");
  const opener =
    process.platform === "win32" ? `start "" "${url}"` :
    process.platform === "darwin" ? `open "${url}"` :
    `xdg-open "${url}"`;
  exec(opener);
});
