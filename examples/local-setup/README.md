# local-ai-setup

Stack 100% grátis pra rodar LLMs open-source na sua máquina — chat, agente de código, e demos de multi-agente. Funciona offline depois de instalado, sem API key, sem rate limit.

Otimizado pra Windows + GPU (testado em RTX 5080), mas funciona em qualquer hardware que rode Ollama.

## Instalação (1 comando)

Clona esse repo e roda o `install.cmd`:

```cmd
git clone https://github.com/GFCDOTA/openclaude.git
cd openclaude\examples\local-setup
install.cmd
```

O instalador faz tudo:

1. Baixa e instala o [Ollama](https://ollama.com/) (~800MB)
2. Baixa 3 modelos (total ~23GB): `llama3.1:8b`, `qwen2.5-coder:14b`, `deepseek-r1:14b`
3. Instala `openclaude` e `codex` globais via `npm`
4. Persiste variáveis de ambiente
5. Aplica fix do `rg.exe` faltante no pacote npm do openclaude

**Pré-requisitos:** Node.js 18+, ~25GB de disco livre, internet.

## O que cada coisa faz

### Chat e agente (uso diário)
| Launcher | O que é |
|---|---|
| `chat.cmd` | Chat direto com `llama3.1:8b` — tipo ChatGPT offline, sem tool calls |
| `start-codex.cmd` | Agente que edita arquivos e roda comandos, via Ollama |
| `start-codex-exec.cmd "pergunta"` | Codex one-shot (sem entrar em modo interativo) |
| `start-openclaude.cmd` | Mesma ideia do codex, interface diferente |

### Demos de multi-agente (pra ver IAs conversando)
| Launcher | Pipeline |
|---|---|
| `demo-ai-to-ai.cmd` | Llama pergunta → Qwen-Coder responde → Llama comenta |
| `demo-ai-to-claude.cmd` | Llama local → Claude Desktop (requer `claude /login`) |
| `demo-debate.cmd [tema]` | Llama vs Qwen debatem, DeepSeek-R1 julga |
| `demo-plan-execute-review.cmd [tarefa]` | Llama planeja → Qwen implementa → DeepSeek revisa |
| `demo-reasoning.cmd [pergunta]` | DeepSeek-R1 resolve mostrando o raciocínio |

**Exemplos com prompt customizado:**
```cmd
demo-debate.cmd "Vim vs VSCode em 2026"
demo-plan-execute-review.cmd "parser de CSV que ignora linhas comentadas"
demo-reasoning.cmd "um trem sai de SP a 80km/h, outro de RJ a 100km/h, quando se encontram?"
```

## Como funciona por baixo

```
Voce (cmd.exe)
    ↓
Launcher .cmd   ← seta env vars e chama o CLI
    ↓
CLI (codex/openclaude/node)
    ↓
Ollama HTTP em localhost:11434   ← servidor local rodando 24/7
    ↓
Modelo carregado na GPU (ou RAM se nao tem GPU)
    ↓
Resposta sobe de volta pela mesma corrente
```

Tudo roda na sua máquina. Zero tráfego pra nuvem. Sem conta, sem chave, sem limite.

## Modelos incluídos e pra que servem

| Modelo | Tamanho | Uso típico |
|---|---|---|
| `llama3.1:8b` | 4.9GB | Chat em PT-BR, respostas rápidas, comentários |
| `qwen2.5-coder:14b` | 9.0GB | Gerar e editar código, usar como agente |
| `deepseek-r1:14b` | 9.0GB | Raciocínio passo-a-passo, revisão de código |

**Adicionar outros:**
```cmd
ollama pull mistral:7b
ollama pull qwen2.5:14b
ollama list
```

## Requisitos de hardware

- **Mínimo:** 16GB RAM, 30GB disco (só 1 modelo menor)
- **Recomendado:** 32GB+ RAM ou GPU com 8GB+ VRAM
- **Ideal:** GPU com 16GB+ VRAM (roda modelos 14B inteiros na GPU, latência baixa)

Sem GPU, os modelos 14B ainda rodam na CPU — só ficam 5-10× mais lentos.

## Troubleshooting

**`ollama: command not found` após instalar**
Feche e abra o cmd de novo. O PATH é atualizado só em novos shells.

**Launcher abre e fecha rápido**
Rode ele direto no cmd (`cd` até o diretório, depois `demo-ai-to-ai.cmd`) pra ver a mensagem de erro.

**`fetch failed` no JS**
Ollama não tá rodando. Abre o tray do Windows, confirma o icone do Ollama. Ou roda `ollama serve` manual.

**`openclaude -p` fica silencioso no cmd aninhado**
Bug conhecido no Windows. Use modo interativo (duplo-clique no launcher) ou use `start-codex.cmd` que não tem esse problema.

## Créditos

- [Ollama](https://ollama.com) — MIT
- [openclaude](https://github.com/Gitlawb/openclaude) — MIT (fork do Claude Code)
- [OpenAI Codex CLI](https://github.com/openai/codex) — Apache 2.0
- Modelos: [Qwen 2.5](https://qwenlm.github.io), [Llama 3.1](https://ai.meta.com/llama/), [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1)

## Licença

MIT.
