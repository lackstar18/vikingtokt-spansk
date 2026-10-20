# Instalador de Vikingtokt (lo ejecuta Instalar.bat o Vikingtokt-Installer.exe). Solo para el usuario actual, sin administrador.
# -Python: el python.exe que ya ha encontrado o instalado el .exe. -Prueba: solo comprueba, no registra nada (para probar en el PC de Elena).
param([string]$Python = '', [switch]$Prueba)
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

function ProbarPy($cmd, $extra) {
  try {
    $o = & $cmd @extra -c "import sys;print(sys.executable)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $o) { return ($o | Select-Object -First 1).Trim() }
  } catch {}
  return $null
}
$exe = if ($Python -and (Test-Path $Python)) { $Python } else { $null }
if (-not $exe) { $exe = ProbarPy 'py' @('-3') }
if (-not $exe) { $exe = ProbarPy 'python' @() }
if (-not $exe) {
  Write-Host ''
  Write-Host 'Python mangler på denne PC-en.' -ForegroundColor Red
  Write-Host 'Last ned og kjør Vikingtokt-Installer.exe i stedet (den installerer Python selv):'
  Write-Host 'https://github.com/lackstar18/vikingtokt-spansk/releases/latest/download/Vikingtokt-Installer.exe'
  exit 1
}
$pyw = Join-Path (Split-Path $exe) 'pythonw.exe'
if (-not (Test-Path $pyw)) { $pyw = $exe }
if ($Prueba) { Write-Host "PRUEBA ok: python=$exe pythonw=$pyw dir=$dir"; exit 0 }

# 1) Krigshornet kl. 20:00, mandag til fredag
$dias = 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
$t = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $dias -At '20:00'
$a = New-ScheduledTaskAction -Execute $pyw -Argument ('"' + (Join-Path $dir 'aviso20.py') + '"') -WorkingDirectory $dir
$s = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 5)
Register-ScheduledTask -TaskName 'Vikingtokt 20-00' -Trigger $t -Action $a -Settings $s -Description 'Krigshornet: dagens spansktokt (mandag-fredag)' -Force | Out-Null

# 2) Duellen starter når PC-en starter (snarvei i Oppstart)
$ws = New-Object -ComObject WScript.Shell
$argsDuelo = '"' + (Join-Path $dir 'duelo.py') + '" --app es --progreso "' + (Join-Path $dir 'progreso.json') + '"'
$lnk = $ws.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Startup')) 'Vikingtokt duell.lnk'))
$lnk.TargetPath = $pyw; $lnk.Arguments = $argsDuelo; $lnk.WorkingDirectory = $dir; $lnk.WindowStyle = 7; $lnk.Save()

# 3) Snarvei på skrivebordet
$lnk = $ws.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Vikingtokt.lnk'))
$lnk.TargetPath = $pyw; $lnk.Arguments = '"' + (Join-Path $dir 'servidor.py') + '"'; $lnk.WorkingDirectory = $dir
if (Test-Path (Join-Path $dir 'arte\vikingtokt.ico')) { $lnk.IconLocation = (Join-Path $dir 'arte\vikingtokt.ico') }
$lnk.Save()

# 4) Start duellen nå
Start-Process -FilePath $pyw -ArgumentList $argsDuelo -WorkingDirectory $dir -WindowStyle Hidden

Write-Host ''
Write-Host 'Ferdig!' -ForegroundColor Green
Write-Host '- Krigshornet lyder kl. 20:00 mandag til fredag.'
Write-Host '- Spillet: "Vikingtokt" på skrivebordet.'
Write-Host '- Hvis Windows spør om brannmuren for Python: trykk "Allow access" (privat nettverk). Det trengs for duellen med Elena.'
