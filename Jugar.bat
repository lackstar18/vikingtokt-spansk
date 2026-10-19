@echo off
rem Abre el juego con su servidor (guarda el progreso en archivo, aviso de las 20:00, duelo y DeepSeek).
where pyw >nul 2>nul && (start "" pyw -3 "%~dp0servidor.py" & exit /b)
where pythonw >nul 2>nul && (start "" pythonw "%~dp0servidor.py" & exit /b)
start "" "%~dp0index.html"
