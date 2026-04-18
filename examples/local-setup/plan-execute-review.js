// Pipeline: Llama planeja -> Qwen-Coder implementa -> DeepSeek-R1 revisa.
// Uso: node plan-execute-review.js ["tarefa"]
const OLLAMA = "http://localhost:11434/v1/chat/completions";

async function ask(model, user, maxTokens = 400) {
  const r = await fetch(OLLAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: user }],
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
  const d = await r.json();
  return d.choices[0].message.content.trim();
}

const tarefa = process.argv.slice(2).join(" ").trim() ||
  "uma funcao Python que valide se uma string e um CPF valido";

const line = "=".repeat(60);
console.log(line);
console.log(`PIPELINE: Plan -> Execute -> Review`);
console.log(`Tarefa: ${tarefa}`);
console.log(line);

console.log("\n[1/3] Llama planeja os passos...");
const plano = await ask(
  "llama3.1:8b",
  `Bole um plano curto (3-5 passos enumerados) para implementar: ${tarefa}. ` +
  `Apenas os passos, sem codigo.`,
  300
);
console.log(`\n>> PLANO:\n${plano}\n`);

console.log("[2/3] Qwen-Coder implementa...");
const codigo = await ask(
  "qwen2.5-coder:14b",
  `Seguindo este plano:\n${plano}\n\nImplemente: ${tarefa}. ` +
  `Somente o codigo em Python, sem explicacao prosa. Use markdown com \`\`\`python.`,
  600
);
console.log(`\n>> CODIGO:\n${codigo}\n`);

console.log("[3/3] DeepSeek-R1 revisa...");
const review = await ask(
  "deepseek-r1:14b",
  `Revise este codigo Python para a tarefa "${tarefa}":\n\n${codigo}\n\n` +
  `Aponte bugs, casos-limite faltando, e melhorias. Maximo 5 itens objetivos.`,
  600
);
console.log(`\n>> REVIEW:\n${review}\n`);
console.log(line);
