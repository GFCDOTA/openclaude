@echo off
REM Debate 3-agentes: Llama vs Qwen, DeepSeek-R1 julga.
REM Uso: demo-debate.cmd                             (tema default)
REM      demo-debate.cmd "Vim vs VSCode"             (tema customizado)
node "%~dp0debate.js" %*
pause
