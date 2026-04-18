# Prompt de handoff — setup local de LLM do Felipe

Cole isso no início de uma nova sessão do Claude pra ela saber o que você já tem rodando.

---

## O que já está instalado e configurado

**Hardware:** Windows 11 Pro, RTX 5080 (16GB VRAM), 64GB RAM, E:\ com 2TB livre.

**Backend LLM local (Ollama):**
- Ollama 0.21.0 instalado em `C:\Users\felip_local\AppData\Local\Programs\Ollama\`
- Servidor HTTP rodando em `http://localhost:11434` (auto-start com Windows)
- Endpoint compatível com OpenAI API em `http://localhost:11434/v1`
- Modelos baixados:
  - `qwen2.5-coder:14b` (9GB) — código/agente
  - `llama3.1:8b` (4.9GB) — conversa geral

**CLIs instalados globalmente (npm):**
- `openclaude` (v0.4.0) — fork do Claude Code, aceita providers OpenAI-compat
- `codex` (v0.118.0+) — CLI da OpenAI com flag `--oss` nativa pra Ollama

**Variáveis de ambiente persistidas (setx, user-level):**
```
CLAUDE_CODE_USE_OPENAI=1
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=qwen2.5-coder:14b
```

**Launchers prontos em `E:\Openclaude\`:**
| Arquivo | Função |
|---|---|
| `chat.cmd` | Chat direto com llama3.1 (REPL do Ollama) |
| `start-codex.cmd` | Codex modo agente via qwen2.5-coder |
| `start-codex-exec.cmd "prompt"` | Codex one-shot |
| `start-openclaude.cmd` | OpenClaude modo agente |
| `demo-ai-to-ai.cmd` | Llama → Qwen-Coder → Llama (100% local, grátis) |
| `demo-ai-to-claude.cmd` | Llama → Claude Desktop (consome plano Claude) |

**Fix manual aplicado:**
- `rg.exe` copiado do pacote do codex para `.../openclaude/dist/vendor/ripgrep/x64-win32/` (o pacote npm do openclaude não traz o binário no Windows).

**Bug conhecido:**
- `openclaude -p "prompt"` em shells aninhados no Windows sai com exit 0 sem output. Usar em cmd.exe real (duplo-clique no .cmd) funciona, ou usar `codex exec` pra testes automatizados.

**Claude Desktop CLI:**
- Binário em `C:\Users\felip_local\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude-code\<versão>\claude.exe`
- Precisa `claude /login` pra funcionar fora do Claude Desktop.

**Repo dos scripts (pra portar pra outras máquinas):**
- Local: `E:\local-ai-setup\`
- GitHub (PR em andamento): https://github.com/GFCDOTA/openclaude

## O que a nova sessão pode fazer

- Chamar `curl http://localhost:11434/v1/chat/completions` pra conversar com qualquer modelo local
- Rodar `ollama list` pra ver modelos; `ollama pull <nome>` pra adicionar outros
- Usar os launchers em `E:\Openclaude\` ou `E:\local-ai-setup\` diretamente
- Pra chamar Claude Desktop via CLI: o caminho do claude.exe pode ser encontrado com glob em `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude-code\*\claude.exe`

## O que NÃO precisa refazer

- Instalar Ollama (já tem)
- Baixar modelos (qwen2.5-coder:14b e llama3.1:8b já estão lá)
- Instalar openclaude/codex (já global)
- Setar env vars (já persistidas)
- Criar launchers (já prontos)
