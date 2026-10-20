# Quita lo que puso Instalar.bat (y, si se instaló con Vikingtokt-Installer.exe, también su carpeta).
$ErrorActionPreference = 'SilentlyContinue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Unregister-ScheduledTask -TaskName 'Vikingtokt 20-00' -Confirm:$false
Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'Vikingtokt duell.lnk')
Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Vikingtokt.lnk')
Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Vikingtokt' -Recurse
Get-CimInstance Win32_Process -Filter "Name like 'python%'" | Where-Object { $_.CommandLine -like "*$dir*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Host 'Fjernet: krigshornet kl. 20:00, duellen ved oppstart og snarveien.' -ForegroundColor Green
# Solo la carpeta del instalador (%LOCALAPPDATA%\Vikingtokt), nunca una carpeta copiada a mano
if ($dir -eq (Join-Path $env:LOCALAPPDATA 'Vikingtokt')) {
  Write-Host 'Spillet er slettet fra PC-en. Har du synk-kode, ligger leiren din fortsatt i skyen.'
  Start-Process cmd.exe -ArgumentList '/c', "timeout /t 2 /nobreak >nul & rmdir /s /q `"$dir`"" -WindowStyle Hidden
}
