@echo off
setlocal enableextensions enabledelayedexpansion

:: Change to the script's directory (handles UNC paths by creating a temporary drive mapping if needed)
pushd "%~dp0"

echo ==========================================
echo      Video Captions App - Start
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found!
    echo.
    echo Please install Python 3.10+ from: https://www.python.org/downloads/
    echo.
    echo IMPORTANT: Make sure to check "Add Python to PATH" during installation.
    echo.
    echo If you have installed Python, try restarting this script.
    echo.
    pause
    popd
    exit /b
)

:: Create venv if it doesn't exist
if not exist .venv (
    echo [INFO] Creating virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment. 
        echo Please ensure you have write permissions in this folder.
        pause
        popd
        exit /b
    )
)

:: Activate venv
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo [ERROR] Virtual environment seems corrupt (.venv/Scripts/activate.bat missing).
    echo Please delete the .venv folder and try again.
    pause
    popd
    exit /b
)

:: Run the python automation script (pass all args)
python run_local.py %*

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application exited with an error.
    pause
) else (
    echo [INFO] Application stopped.
)

popd
