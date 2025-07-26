@echo off
echo Starting Knitwear ERP System...
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r backend\requirements.txt

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0 && venv\Scripts\activate.bat && cd backend && python simple_app.py"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0 && cd frontend && python -m http.server 8000"

echo.
echo Application is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8000
echo.
echo Both servers are now running in separate windows.
echo Close this window when done.
echo.
pause 