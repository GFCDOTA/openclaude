@echo off
REM llama local -> Claude Desktop. CONSOME SEU PLANO CLAUDE.
REM Exige login 1x: abra outro cmd e rode:  claude /login
REM (ou o caminho completo do claude.exe do Claude Desktop)
node "%~dp0ai-talks-to-claude.js"
pause
