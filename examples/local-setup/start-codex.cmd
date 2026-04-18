@echo off
REM Codex agente local (edita arquivos, roda comandos) via Ollama.
REM Uso interativo: start-codex.cmd
REM Com prompt inicial: start-codex.cmd "tua pergunta"
codex --oss --local-provider ollama --model qwen2.5-coder:14b %*
