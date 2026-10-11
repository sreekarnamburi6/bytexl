$postgresRoot = Join-Path $env:ProgramFiles "PostgreSQL"
$postgresBin = Get-ChildItem $postgresRoot -Directory -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  ForEach-Object { Join-Path $_.FullName "bin" } |
  Where-Object { Test-Path (Join-Path $_ "initdb.exe") } |
  Select-Object -First 1

if (-not $postgresBin) {
  throw "PostgreSQL server tools were not found under $postgresRoot. Install PostgreSQL or use Docker Desktop."
}

$dataDirectory = Join-Path $env:LOCALAPPDATA "MEDISCOPE\postgres-data"
$parentDirectory = Split-Path $dataDirectory
New-Item -ItemType Directory -Force -Path $parentDirectory | Out-Null

if (-not (Test-Path (Join-Path $dataDirectory "PG_VERSION"))) {
  & (Join-Path $postgresBin "initdb.exe") -D $dataDirectory -U mediscope --auth-local=trust --auth-host=trust --encoding=UTF8 --no-locale
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& (Join-Path $postgresBin "pg_ctl.exe") -D $dataDirectory status *> $null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $postgresBin "pg_ctl.exe") -D $dataDirectory -l (Join-Path $dataDirectory "server.log") -o "-p 5433 -h 127.0.0.1" start
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$databaseExists = & (Join-Path $postgresBin "psql.exe") -h 127.0.0.1 -p 5433 -U mediscope -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'mediscope'"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if ($databaseExists.Trim() -ne "1") {
  & (Join-Path $postgresBin "createdb.exe") -h 127.0.0.1 -p 5433 -U mediscope mediscope
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "MEDISCOPE PostgreSQL is ready on 127.0.0.1:5433."