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
import { lookup } from "node:dns/promises";

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

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 local-ai-setup";

// --- SSRF guard: resolve hostname e bloqueia IPs privados/internos ---
function isPrivateIp(ip){
  if(!ip) return true;
  // IPv4
  if(/^127\./.test(ip)) return true;           // loopback
  if(/^10\./.test(ip)) return true;            // privado A
  if(/^192\.168\./.test(ip)) return true;      // privado C
  if(/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true; // privado B
  if(/^169\.254\./.test(ip)) return true;      // link-local
  if(/^0\./.test(ip)) return true;             // invalido
  if(/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return true; // CGN
  // IPv6
  if(ip === "::1") return true;                // loopback
  if(/^fe80:/i.test(ip)) return true;          // link-local
  if(/^fc00:/i.test(ip) || /^fd/i.test(ip)) return true; // ULA
  return false;
}

async function assertPublicUrl(rawUrl){
  let u;
  try{ u = new URL(rawUrl); }catch{ throw new Error("URL invalida"); }
  if(!/^https?:$/.test(u.protocol)) throw new Error("so http/https permitido");
  if(/^localhost$/i.test(u.hostname)) throw new Error("hostname bloqueado (localhost)");
  try{
    const { address } = await lookup(u.hostname, { family: 0 });
    if(isPrivateIp(address)) throw new Error(`bloqueado: ${u.hostname} -> ${address} (rede privada/interna)`);
    return { url: u.toString(), resolved: address };
  }catch(e){
    if(/bloqueado/.test(e.message)) throw e;
    throw new Error(`DNS falhou pra ${u.hostname}: ${e.message}`);
  }
}

function stripTags(html){
  return html
    .replace(/<script[\s\S]*?<\/script>/gi,"")
    .replace(/<style[\s\S]*?<\/style>/gi,"")
    .replace(/<!--[\s\S]*?-->/g,"")
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi,"\n")
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;/g," ")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/[ \t]+/g," ")
    .replace(/\n\s*\n+/g,"\n\n")
    .trim();
}

const tools = {
  async web_search({ query, max_results = 8 }){
    if(!query) throw new Error("query obrigatorio");
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await assertPublicUrl(ddgUrl);
    const r = await fetch(ddgUrl, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
    if(!r.ok) throw new Error(`DuckDuckGo HTTP ${r.status}`);
    const html = await r.text();
    const results = [];
    const re = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snipRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    const snippets = []; let sm;
    while((sm = snipRe.exec(html))) snippets.push(stripTags(sm[1]));
    let m, i = 0;
    while((m = re.exec(html)) && results.length < max_results){
      let target = m[1];
      try{
        const u = new URL(target, "https://html.duckduckgo.com");
        const real = u.searchParams.get("uddg"); if(real) target = decodeURIComponent(real);
      }catch{}
      results.push({ url: target, title: stripTags(m[2]), snippet: snippets[i] || "" });
      i++;
    }
    return { query, count: results.length, results, warning: "UNTRUSTED_WEB_DATA" };
  },

  async web_fetch({ url, max_chars = 6000, skip_reader = false }){
    if(!url) throw new Error("url obrigatorio");
    const checked = await assertPublicUrl(url);
    // 1. Tenta Jina Reader (gratis, sem key, ja entrega markdown limpo — mitigacao principal)
    if(!skip_reader){
      try{
        const readerUrl = `https://r.jina.ai/${url}`;
        const rr = await fetch(readerUrl, {
          headers: { "User-Agent": UA, "Accept": "text/plain", "X-No-Cache": "true" },
          redirect: "follow",
          signal: AbortSignal.timeout(30000),
        });
        if(rr.ok){
          const text = await rr.text();
          return {
            url: checked.url, via: "jina-reader", status: rr.status,
            content: text.slice(0, max_chars),
            truncated: text.length > max_chars, total_length: text.length,
            warning: "UNTRUSTED_WEB_DATA",
          };
        }
      }catch{ /* cai no fallback */ }
    }
    // 2. Fallback: fetch direto + strip de HTML
    const r = await fetch(checked.url, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    const ctype = r.headers.get("content-type") || "";
    const text = await r.text();
    let content;
    if(ctype.includes("application/json")){ content = text; }
    else if(ctype.includes("text/html") || text.includes("<html")){ content = stripTags(text); }
    else { content = text; }
    return {
      url: checked.url, via: "direct-stripped", status: r.status, content_type: ctype,
      content: content.slice(0, max_chars),
      truncated: content.length > max_chars, total_length: content.length,
      warning: "UNTRUSTED_WEB_DATA",
    };
  },

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
