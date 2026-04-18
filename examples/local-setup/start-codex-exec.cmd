@echo off
REM Codex one-shot (nao-interativo) via Ollama.
REM Uso: start-codex-exec.cmd "sua pergunta"
codex exec --oss --local-provider ollama --model qwen2.5-coder:14b --sandbox workspace-write --skip-git-repo-check "%~1"
