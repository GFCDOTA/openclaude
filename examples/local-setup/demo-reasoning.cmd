@echo off
REM DeepSeek-R1 mostra o raciocinio passo-a-passo antes da resposta.
REM Uso: demo-reasoning.cmd                              (pergunta default)
REM      demo-reasoning.cmd "quanto e 23 * 47 + 15?"     (customizada)
node "%~dp0reasoning.js" %*
pause
