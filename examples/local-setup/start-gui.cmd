@echo off
REM Abre a GUI local no navegador (Chrome/Edge/Firefox, o que for default).
REM Porta: 5173 (muda via: set GUI_PORT=8080 & start-gui.cmd)
cd /d "%~dp0"
node gui-server.js
