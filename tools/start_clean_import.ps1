# start_clean_import.ps1
# Run as Administrator in PowerShell. This script will:
#  - create a clean datadir under C:\new_xampp\mysql\data_clean_import_<timestamp>
#  - write a minimal my.ini for a dedicated mysqld on port 3320
#  - initialize the datadir (insecure, no root password) and start mysqld
#  - import SQL files from recovered_sql and recovery_on_copy_*/level_4
#  - write logs under C:\new_xampp\mysql\clean_import_logs_<timestamp>

param()

$basedir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$cleanData = "C:\new_xampp\mysql\data_clean_import_$ts"
$logDir = "C:\new_xampp\mysql\clean_import_logs_$ts"
$mysqld = "C:\new_xampp\mysql\bin\mysqld.exe"
$mysql = "C:\new_xampp\mysql\bin\mysql.exe"

Write-Host "Creating datadir: $cleanData"
New-Item -ItemType Directory -Force -Path $cleanData | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Initialize datadir
Write-Host "Initializing datadir (this may take a few seconds)..."
& cmd /c ""$mysqld" --initialize-insecure --datadir=$cleanData" 2>&1 | Tee-Object -FilePath (Join-Path $logDir 'init.log')

# Write custom my.ini
$customIni = Join-Path $logDir 'my_clean_3320.ini'
$ini = @"
[mysqld]
port=3320
basedir=C:/new_xampp/mysql
datadir=$cleanData
socket=
skip-networking=0
bind-address=127.0.0.1
secure-file-priv=
log_error=$(Join-Path $logDir 'mysql_error.log')
innodb_buffer_pool_size=16M
innodb_log_file_size=16M
"@
Set-Content -Path $customIni -Value $ini -Encoding ASCII
Write-Host "Wrote custom ini: $customIni"

# Start mysqld in background
$launchLog = Join-Path $logDir 'launch.log'
Write-Host "Starting mysqld on port 3320 (logs: $launchLog)"
Start-Process -FilePath cmd -ArgumentList "/c \"$mysqld\" --defaults-file=$customIni --console > $launchLog 2>&1 &" -WindowStyle Hidden -PassThru | Out-Null
Start-Sleep -Seconds 6
Get-Content -Path $launchLog -Tail 120 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }

# Wait until connection is available (timeout 30s)
$connected = $false
$start = Get-Date
while((Get-Date) - $start -lt (New-TimeSpan -Seconds 30)){
    try{
        & $mysql -u root -h 127.0.0.1 -P 3320 -e "SELECT 1;" 2>$null | Out-Null
        $connected = $true; break
    }catch{}
    Start-Sleep -Seconds 1
}
if(-not $connected){ Write-Host "Could not connect to mysqld on port 3320. Check $launchLog and $logDir\mysql_error.log"; exit 1 }
Write-Host "mysqld is accepting connections on 3320"

# Import recovered SQLs
$recovered = Join-Path $basedir '..\recovered_sql' | Resolve-Path -ErrorAction SilentlyContinue
if($recovered){
    Get-ChildItem -Path $recovered -Filter '*.sql' -File -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Importing $($_.FullName)"
    $impLog = (Join-Path $logDir "$($_.BaseName).import.log")
    & cmd /c ""$mysql" -u root -h 127.0.0.1 -P 3320 < \"$($_.FullName)\"" 2>&1 | Tee-Object -FilePath $impLog
    }
}

# Also try importing level_4 recovered SQLs if present
$level4 = 'C:\new_xampp\mysql\recovery_on_copy_20251012_230053\level_4'
if(Test-Path $level4){
    Get-ChildItem -Path $level4 -Filter '*.sql' -File | ForEach-Object {
    Write-Host "Importing $($_.FullName)"
    $impLog = (Join-Path $logDir "$($_.BaseName).import.log")
    & cmd /c ""$mysql" -u root -h 127.0.0.1 -P 3320 < \"$($_.FullName)\"" 2>&1 | Tee-Object -FilePath $impLog
    }
}

# Final: show databases and tables for ems_db
Write-Host 'Databases on new server:'
& $mysql -u root -h 127.0.0.1 -P 3320 -e "SHOW DATABASES;" | ForEach-Object { Write-Host $_ }
Write-Host "Listing tables in ems_db (if present):"
& $mysql -u root -h 127.0.0.1 -P 3320 -e "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='ems_db' ORDER BY table_name;" | ForEach-Object { Write-Host $_ }

Write-Host "Clean import finished. Logs in: $logDir"
