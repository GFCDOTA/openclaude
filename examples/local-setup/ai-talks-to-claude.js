// Llama local faz pergunta -> Claude Desktop responde (consome teu plano Claude).
// Requer: Claude Desktop instalado + "claude /login" feito 1x.
// Uso:  node ai-talks-to-claude.js
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OLLAMA = "http://localhost:11434/v1/chat/completions";

function findClaudeExe() {
  // 1) PATH
  try {
    execFileSync("claude", ["--version"], { stdio: "ignore" });
    return "claude";
  } catch {}
  // 2) Padrao Claude Desktop no Windows (MSIX)
  const base = join(process.env.LOCALAPPDATA || "", "Packages");
  if (existsSync(base)) {
    for (const pkg of readdirSync(base)) {
      if (!pkg.startsWith("Claude_")) continue;
      const codeDir = join(base, pkg, "LocalCache", "Roaming", "Claude", "claude-code");
      if (!existsSync(codeDir)) continue;
      const versions = readdirSync(codeDir).sort().reverse();
      for (const v of versions) {
        const exe = join(codeDir, v, "claude.exe");
        if (existsSync(exe)) return exe;
      }
    }
  }
  throw new Error(
    "claude.exe nao encontrado. Instale o Claude Desktop e rode 'claude /login' uma vez."
  );
}

const CLAUDE_EXE = findClaudeExe();

async function askLlama(prompt) {
  const r = await fetch(OLLAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1:8b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    }),
  });
  if (!r.ok) throw new Error(`Ollama HTTP ${r.status}. Esta rodando?`);
  const d = await r.json();
  return d.choices[0].message.content.trim();
}

function askClaude(prompt) {
  const out = execFileSync(CLAUDE_EXE, ["-p", prompt], {
    encoding: "utf-8",
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return out.trim();
}

const line = "=".repeat(60);
console.log(line);
console.log("DEMO: Llama local  ->  Claude Desktop");
console.log(`claude.exe: ${CLAUDE_EXE}`);
console.log(line);

console.log("\n[1/3] Pedindo pro Llama bolar uma pergunta...");
const pergunta = await askLlama(
  "Bole UMA pergunta curta e criativa sobre programacao ou tecnologia, " +
  "em portugues. So a pergunta, sem preambulo."
);
console.log(`\n>> LLAMA PERGUNTOU:\n${pergunta}\n`);

console.log("[2/3] Mandando pergunta pro Claude Desktop...");
const resposta = askClaude(pergunta);
console.log(`\n>> CLAUDE RESPONDEU:\n${resposta}\n`);

console.log("[3/3] Pedindo pro Llama comentar a resposta...");
const comentario = await askLlama(
  `Voce perguntou: "${pergunta}"\n\n` +
  `Claude respondeu:\n${resposta}\n\n` +
  "O que voce acha da resposta? Comentario curto, em portugues."
);
console.log(`\n>> LLAMA COMENTOU:\n${comentario}\n`);
console.log(line);
console.log("Fim.");
