// 100% local e gratis: Llama pergunta -> Qwen-Coder responde -> Llama comenta.
// Uso:  node ai-talks-to-ai.js
const OLLAMA = "http://localhost:11434/v1/chat/completions";

async function ask(model, prompt, maxTokens = 300) {
  const r = await fetch(OLLAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) throw new Error(`Ollama HTTP ${r.status}. Esta rodando? (ollama serve)`);
  const d = await r.json();
  return d.choices[0].message.content.trim();
}

const line = "=".repeat(60);
console.log(line);
console.log("DEMO 100% LOCAL: Llama (chat)  <->  Qwen-Coder (codigo)");
console.log(line);

console.log("\n[1/3] Llama bola uma pergunta tecnica...");
const pergunta = await ask(
  "llama3.1:8b",
  "Bole UMA pergunta curta e especifica sobre programacao Python, em portugues. So a pergunta.",
  80
);
console.log(`\n>> LLAMA PERGUNTOU:\n${pergunta}\n`);

console.log("[2/3] Qwen-Coder responde...");
const resposta = await ask("qwen2.5-coder:14b", pergunta, 400);
console.log(`\n>> QWEN RESPONDEU:\n${resposta}\n`);

console.log("[3/3] Llama da o veredito...");
const comentario = await ask(
  "llama3.1:8b",
  `Voce perguntou: "${pergunta}"\n\n` +
  `Outra IA respondeu:\n${resposta}\n\n` +
  "A resposta foi boa? Comentario curto, em portugues.",
  150
);
console.log(`\n>> LLAMA COMENTOU:\n${comentario}\n`);
console.log(line);
console.log("Fim. Nenhum centavo gasto, nenhum token enviado pra nuvem.");
