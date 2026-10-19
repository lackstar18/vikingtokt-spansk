# Quita lo que puso Instalar.bat.
$ErrorActionPreference = 'SilentlyContinue'
Unregister-ScheduledTask -TaskName 'Vikingtokt 20-00' -Confirm:$false
Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'Vikingtokt duell.lnk')
Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Vikingtokt.lnk')
Write-Host 'Fjernet: krigshornet kl. 20:00, duellen ved oppstart og snarveien.' -ForegroundColor Green
