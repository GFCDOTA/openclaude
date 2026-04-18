@echo off
REM Pipeline: Llama planeja -> Qwen implementa -> DeepSeek revisa.
REM Uso: demo-plan-execute-review.cmd                          (tarefa default)
REM      demo-plan-execute-review.cmd "parser de JSON custom"  (tarefa customizada)
node "%~dp0plan-execute-review.js" %*
pause
