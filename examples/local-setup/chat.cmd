@echo off
REM Chat puro com LLM local — sem agente, sem tool calls, so conversa.
REM Comando no prompt: digita e Enter. /bye pra sair, /? pra ajuda.
ollama run llama3.1:8b %*
