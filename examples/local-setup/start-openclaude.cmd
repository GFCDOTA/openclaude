@echo off
REM OpenClaude agente via Ollama. Roda em cmd.exe real (duplo-clique).
REM Env vars pra nao herdar configs do Claude Desktop:
set CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=
set CLAUDE_CODE_OAUTH_TOKEN=
set CLAUDECODE=
set CLAUDE_CODE_EXECPATH=
set CLAUDE_CODE_ENTRYPOINT=
set ANTHROPIC_API_KEY=
set ANTHROPIC_BASE_URL=

set CLAUDE_CODE_USE_OPENAI=1
set OPENAI_BASE_URL=http://localhost:11434/v1
set OPENAI_API_KEY=ollama
set OPENAI_MODEL=qwen2.5-coder:14b

call openclaude %*
