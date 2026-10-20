# Oppdaterer spillet fra GitHub uten å røre fremgangen (lo ejecuta Actualizar.bat).
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
# Reinicia el duelo y el servidor para que usen el código nuevo
Get-CimInstance Win32_Process -Filter "Name like 'python%'" | Where-Object { $_.CommandLine -match 'duelo\.py|servidor\.py' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Vikingtokt duell.lnk'
if (Test-Path $lnk) { Start-Process $lnk }
Write-Host 'Ferdig! Spillet er oppdatert. Fremgangen din er den samme.' -ForegroundColor Green
