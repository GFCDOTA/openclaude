# openclaude

**IA free de pobre** — fork com setup local 100% gratuito: LLMs open-source offline, agentes autônomos com tools (bash, file ops, web seguro), e GUI dark-theme pra não ter que viver no terminal.

## ⚡ Quick start

```cmd
git clone https://github.com/GFCDOTA/openclaude.git
cd openclaude\examples\local-setup
install.cmd
start-gui.cmd
```

Instala Ollama + 3 modelos (llama3.1, qwen2.5-coder, deepseek-r1) + abre a GUI no navegador.

## O que tem em [`examples/local-setup/`](examples/local-setup/)

### 🖥️ GUI local (dark theme)

- **Chat** — modo Conselho (3 IAs conversam, resposta concisa) ou Direto (1 modelo só)
- **Agente** — Claude/Devin na sua máquina: bash, read/write, list, web_search, web_fetch
- **Demos** — AI↔AI, Debate, Plan→Exec→Review, Raciocínio

### 🔒 Web seguro por default

- `web_fetch` via Jina Reader (grátis, sem key, retorna markdown limpo)
- SSRF guard (bloqueia IPs privados antes do fetch)
- Anti-prompt-injection (conteúdo web envolvido em `<web_content>`; system prompt ignora instruções injetadas pela página)

### 📦 Modelos incluídos

| Modelo | Tamanho | Uso |
|---|---|---|
| `llama3.1:8b` | 4.9GB | Chat rápido, PT-BR natural |
| `qwen2.5-coder:14b` | 9GB | Agente, geração de código |
| `deepseek-r1:14b` | 9GB | Raciocínio, síntese, revisão |

### 🧠 Launchers standalone

- `chat.cmd` — REPL direto com llama3.1
- `start-codex.cmd` / `start-openclaude.cmd` — CLIs agente via Ollama
- `demo-*.cmd` — multi-agente via linha de comando

Veja o [README completo do setup](examples/local-setup/README.md).

## Requisitos

- Node.js 18+
- Windows 11 (testado em RTX 5080), macOS/Linux com pequenos ajustes nos .cmd
- ~25GB de disco pros 3 modelos
- GPU com 8GB+ VRAM pra latência baixa (opcional)

## Custo

R$ 0,00. Tudo roda local, sem API key, sem rate limit, sem dados saindo pra nuvem.

## Licença

MIT.
