# Oppdaterer spillet fra GitHub uten å røre fremgangen (lo ejecuta Actualizar.bat, o el juego con -FraSpillet).
param([switch]$FraSpillet, [string]$Python = '')
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$zip = Join-Path $env:TEMP 'vikingtokt.zip'
$ut = Join-Path $env:TEMP 'vikingtokt_ny'
Write-Host 'Laster ned siste versjon...'
Invoke-WebRequest -Uri 'https://github.com/lackstar18/vikingtokt-spansk/archive/refs/heads/main.zip' -OutFile $zip -UseBasicParsing
if (Test-Path $ut) { Remove-Item $ut -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $ut -Force
$kilde = Get-ChildItem $ut -Directory | Select-Object -First 1
$behold = 'progreso.json', 'uso_ia.json', 'clave_deepseek.txt', 'duelo.json', 'aviso_estado.json'
Get-ChildItem $kilde.FullName -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($kilde.FullName.Length + 1)
  if ($behold -notcontains $rel) {
    $mal = Join-Path $dir $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $mal) | Out-Null
    Copy-Item $_.FullName $mal -Force
  }
}
Remove-Item $zip -Force
Remove-Item $ut -Recurse -Force
# Reinicia el duelo y el servidor de ESTA carpeta para que usen el código nuevo (la app de noruego no se toca)
Get-CimInstance Win32_Process -Filter "Name like 'python%'" | Where-Object { $_.CommandLine -match 'duelo\.py|servidor\.py' -and $_.CommandLine -like "*$dir*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
if ($FraSpillet) {
  # desde el juego: vuelve a abrir el servidor (él arranca también el duelo) y la pestaña se recarga sola
  if (-not $Python) { $Python = 'pythonw' }
  Start-Sleep -Seconds 1
  Start-Process -FilePath $Python -ArgumentList @("`"$(Join-Path $dir 'servidor.py')`"", '--sin-navegador') -WorkingDirectory $dir -WindowStyle Hidden
} else {
  $lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Vikingtokt duell.lnk'
  if (Test-Path $lnk) { Start-Process $lnk }
}
# Ikonet på skrivebordet (fantes ikke før 20. okt)
$ico = Join-Path $dir 'arteikingtokt.ico'
$snarvei = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Vikingtokt.lnk'
if ((Test-Path $ico) -and (Test-Path $snarvei)) { $ws = New-Object -ComObject WScript.Shell; $l = $ws.CreateShortcut($snarvei); $l.IconLocation = $ico; $l.Save() }
Write-Host 'Ferdig! Spillet er oppdatert. Fremgangen din er den samme.' -ForegroundColor Green
