// Servidor local: serve a GUI + expoe tools (bash, file ops, git) pra aba Agente.
// Uso:  node gui-server.js   (abre http://localhost:5173)
// SEGURANCA: binda so em 127.0.0.1. Executa comandos ARBITRARIOS do LLM na sua maquina.
//            So use se confia no modelo local (voce esta usando).
import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync, writeFileSync, statSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.GUI_PORT || 5173);
const AGENT_CWD = process.env.AGENT_CWD || process.cwd();

const execP = promisify(exec);

async function readBody(req){
  return new Promise((resolve, reject)=>{
    let chunks = [];
    req.on("data", c=>chunks.push(c));
    req.on("end", ()=>{
      try{ resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}")); }
      catch(e){ reject(e); }
    });
    req.on("error", reject);
  });
}

function json(res, status, obj){
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8"});
  res.end(JSON.stringify(obj));
}

const tools = {
  async run_bash({ command, cwd, timeout_ms = 60000 }){
    if(!command) throw new Error("command obrigatorio");
    const workdir = cwd ? resolve(AGENT_CWD, cwd) : AGENT_CWD;
    const shell = process.platform === "win32" ? "cmd.exe" : "bash";
    const shellArgs = process.platform === "win32" ? ["/c", command] : ["-c", command];
    return new Promise((resolve)=>{
      const child = execFile(shell, shellArgs, { cwd: workdir, timeout: timeout_ms, maxBuffer: 5*1024*1024 },
        (err, stdout, stderr)=>{
          resolve({
            stdout: stdout?.toString() ?? "",
            stderr: stderr?.toString() ?? "",
            exit_code: err?.code ?? 0,
            timed_out: err?.killed && err.signal === "SIGTERM",
            cwd: workdir,
          });
        });
    });
  },
  async read_file({ path }){
    if(!path) throw new Error("path obrigatorio");
    const p = resolve(AGENT_CWD, path);
    const content = readFileSync(p, "utf-8");
    return { path: p, content, size: content.length };
  },
  async write_file({ path, content, create_dirs = true }){
    if(!path) throw new Error("path obrigatorio");
    if(content == null) throw new Error("content obrigatorio");
    const p = resolve(AGENT_CWD, path);
    if(create_dirs) mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content, "utf-8");
    return { path: p, bytes_written: Buffer.byteLength(content, "utf-8") };
  },
  async list_dir({ path = "." }){
    const p = resolve(AGENT_CWD, path);
    const entries = readdirSync(p).map(name=>{
      try{
        const s = statSync(join(p, name));
        return { name, type: s.isDirectory() ? "dir" : "file", size: s.size };
      }catch{ return { name, type: "?" }; }
    });
    return { path: p, entries };
  },
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/gui.html")) {
    try {
      res.writeHead(200, { "Content-Type":"text/html; charset=utf-8" });
      res.end(readFileSync(join(__dirname, "gui.html")));
    } catch (e) { res.writeHead(500).end("Erro: " + e.message); }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    return json(res, 200, { cwd: AGENT_CWD, platform: process.platform });
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/tool/")) {
    const name = url.pathname.slice("/api/tool/".length);
    const fn = tools[name];
    if(!fn) return json(res, 404, { error: `tool desconhecida: ${name}` });
    try{
      const args = await readBody(req);
      const result = await fn(args);
      return json(res, 200, { ok: true, result });
    }catch(e){
      return json(res, 200, { ok: false, error: e.message });
    }
  }

  res.writeHead(404).end("404");
});

server.listen(PORT, "127.0.0.1", () => {
  const u = `http://localhost:${PORT}`;
  console.log(`\n  Local AI GUI em ${u}`);
  console.log(`  AGENT_CWD: ${AGENT_CWD}`);
  console.log(`  Tools expostos: ${Object.keys(tools).join(", ")}`);
  console.log("  Ctrl+C pra parar.\n");
  const opener =
    process.platform === "win32" ? `start "" "${u}"` :
    process.platform === "darwin" ? `open "${u}"` :
    `xdg-open "${u}"`;
  exec(opener);
});
