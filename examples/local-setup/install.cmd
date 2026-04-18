@echo off
setlocal enableextensions
REM =====================================================================
REM  local-ai-setup — instalador automatico (Windows)
REM  Instala: Ollama + modelos (llama3.1:8b, qwen2.5-coder:14b, deepseek-r1:14b)
REM           + openclaude + codex via npm
REM  Requer: Node.js 18+ ja instalado, conexao de internet, ~25GB de disco livre.
REM =====================================================================

echo.
echo ================================================================
echo   local-ai-setup — instalador
echo ================================================================
echo.

REM ---- 1. Checar Node ----
where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org (LTS^) e rode de novo.
  pause
  exit /b 1
)
echo [OK] Node.js presente:
node --version

REM ---- 2. Instalar Ollama (se nao existir) ----
where ollama >nul 2>&1
if not errorlevel 1 (
  echo [OK] Ollama ja instalado:
  ollama --version
) else (
  echo [..] Baixando instalador do Ollama (~800MB^)...
  curl -L -o "%TEMP%\OllamaSetup.exe" "https://ollama.com/download/OllamaSetup.exe"
  if errorlevel 1 (
    echo [ERRO] Falha ao baixar Ollama. Verifique internet.
    pause
    exit /b 1
  )
  echo [..] Instalando Ollama silencioso...
  "%TEMP%\OllamaSetup.exe" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-
  del "%TEMP%\OllamaSetup.exe"
  echo [OK] Ollama instalado. Aguardando servico subir...
  timeout /t 8 /nobreak >nul
)

REM ---- 3. Baixar modelos ----
echo.
echo [..] Baixando modelo llama3.1:8b (~4.9GB^)...
ollama pull llama3.1:8b
echo.
echo [..] Baixando modelo qwen2.5-coder:14b (~9GB^)...
ollama pull qwen2.5-coder:14b
echo.
echo [..] Baixando modelo deepseek-r1:14b (~9GB^)...
ollama pull deepseek-r1:14b

REM ---- 4. Instalar CLIs npm ----
echo.
echo [..] Instalando openclaude + codex (npm global^)...
call npm install -g @gitlawb/openclaude @openai/codex

REM ---- 5. Env vars persistidas ----
echo.
echo [..] Persistindo variaveis de ambiente...
setx CLAUDE_CODE_USE_OPENAI "1" >nul
setx OPENAI_BASE_URL "http://localhost:11434/v1" >nul
setx OPENAI_API_KEY "ollama" >nul
setx OPENAI_MODEL "qwen2.5-coder:14b" >nul

REM ---- 6. Fix ripgrep do openclaude (bundled binary faltando no npm^) ----
echo.
echo [..] Copiando rg.exe do codex pro openclaude (fix bundled missing^)...
set "OC_VENDOR=%APPDATA%\npm\node_modules\@gitlawb\openclaude\dist\vendor\ripgrep\x64-win32"
set "CODEX_RG=%APPDATA%\npm\node_modules\@openai\codex\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\path\rg.exe"
if exist "%CODEX_RG%" (
  mkdir "%OC_VENDOR%" 2>nul
  copy /Y "%CODEX_RG%" "%OC_VENDOR%\rg.exe" >nul
  echo [OK] rg.exe copiado.
) else (
  echo [WARN] rg.exe do codex nao encontrado; openclaude pode falhar. Instale ripgrep manualmente.
)

echo.
echo ================================================================
echo   Instalacao concluida!
echo   Teste:  demo-ai-to-ai.cmd
echo           chat.cmd
echo ================================================================
echo.
pause
