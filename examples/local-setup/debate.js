// 3 IAs debatem um tema. Llama defende A, Qwen defende B, DeepSeek-R1 julga.
// Uso: node debate.js ["tema livre"]
const OLLAMA = "http://localhost:11434/v1/chat/completions";

async function ask(model, system, user, maxTokens = 300) {
  const r = await fetch(OLLAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
  const d = await r.json();
  return d.choices[0].message.content.trim();
}

const tema = process.argv.slice(2).join(" ").trim() ||
  "Python vs JavaScript para backend em 2026";

const line = "=".repeat(60);
console.log(line);
console.log(`DEBATE: ${tema}`);
console.log(line);

console.log("\n[Llama — defende lado A]");
const ladoA = await ask(
  "llama3.1:8b",
  "Voce e um debatedor afiado. Defenda o lado que lhe for atribuido com argumentos solidos. Maximo 4 frases.",
  `Defenda o primeiro lado do tema: "${tema}". Maximo 4 frases.`,
  250
);
console.log(ladoA);

console.log("\n[Qwen — defende lado B]");
const ladoB = await ask(
  "qwen2.5-coder:14b",
  "Voce e um debatedor afiado. Defenda o lado que lhe for atribuido com argumentos solidos. Maximo 4 frases.",
  `Oponente argumentou:\n${ladoA}\n\nDefenda o lado OPOSTO do tema: "${tema}". Maximo 4 frases.`,
  250
);
console.log(ladoB);

console.log("\n[DeepSeek-R1 — julga]");
const veredito = await ask(
  "deepseek-r1:14b",
  "Voce e um juiz neutro. Analise os argumentos dos dois lados e de um veredito fundamentado.",
  `Tema: ${tema}\n\nLado A:\n${ladoA}\n\nLado B:\n${ladoB}\n\nQual lado argumentou melhor? Por que? Maximo 5 frases.`,
  400
);
console.log(veredito);

console.log("\n" + line);
