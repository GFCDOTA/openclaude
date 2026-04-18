// Raciocinio com DeepSeek-R1: voce ve o modelo "pensando" antes de responder.
// Uso: node reasoning.js ["pergunta"]
const OLLAMA = "http://localhost:11434/v1/chat/completions";

const pergunta = process.argv.slice(2).join(" ").trim() ||
  "Se 5 maquinas levam 5 minutos pra fazer 5 widgets, quanto tempo 100 maquinas levam pra fazer 100 widgets?";

const line = "=".repeat(60);
console.log(line);
console.log("RACIOCINIO (DeepSeek-R1 mostra o pensamento)");
console.log(line);
console.log(`\nPergunta: ${pergunta}\n`);
console.log("Streaming a resposta (o bloco <think>...</think> e o raciocinio interno):\n");

const r = await fetch(OLLAMA, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "deepseek-r1:14b",
    messages: [{ role: "user", content: pergunta }],
    max_tokens: 800,
    stream: true,
  }),
});

for await (const chunk of r.body) {
  const lines = Buffer.from(chunk).toString().split("\n").filter(Boolean);
  for (const l of lines) {
    if (!l.startsWith("data: ")) continue;
    const payload = l.slice(6).trim();
    if (payload === "[DONE]") continue;
    try {
      const j = JSON.parse(payload);
      const delta = j.choices?.[0]?.delta?.content;
      if (delta) process.stdout.write(delta);
    } catch {}
  }
}
console.log("\n\n" + line);
