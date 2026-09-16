param(
    [string]$Destination = (Join-Path $env:LOCALAPPDATA 'Daybreak'),
    [string]$ShortcutDirectory = [Environment]::GetFolderPath('Desktop'),
    [switch]$NoShortcuts,
    [switch]$NoLaunch
)
$ErrorActionPreference = 'Stop'
$Destination = [IO.Path]::GetFullPath($Destination)
$source = [IO.Path]::GetFullPath($PSScriptRoot)
# An explicit package list prevents a used folder's private caches from being copied.
$files = @(
    'index.html', 'app.js', 'daybreak.css', 'themes.js', 'menu.js', 'layout.js',
    'calendar-helper.py', 'calendar-live.js', 'github-sync.py', 'github-widget.js',
    'accounts.js', 'accounts_page.py', 'github-login.py', 'Connect accounts.cmd', 'launch-accounts.ps1',
    'weather.js', 'weather-config.js', 'launch.ps1', 'Open Daybreak.cmd',
    'Start Calendar.cmd', 'README.md', 'CALENDAR-SETUP.md', 'LICENSE',
    'assets\daybreak.svg', 'templates\calendar-data.js', 'templates\github-data.js'
)
foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $source $file) -PathType Leaf)) {
        throw "The download is incomplete: $file is missing. Extract the whole ZIP before running setup."
    }
}
Write-Host "`nDaybreak setup`n" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
foreach ($file in $files) {
    $target = Join-Path $Destination $file
    if ($source.TrimEnd('\') -eq $Destination.TrimEnd('\')) { continue }
    if ($file -eq 'weather-config.js' -and (Test-Path -LiteralPath $target)) { continue }
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination $target -Force
}
foreach ($file in @('calendar-data.js', 'github-data.js')) {
    $target = Join-Path $Destination $file
    if (-not (Test-Path -LiteralPath $target)) {
        Copy-Item -LiteralPath (Join-Path $Destination "templates\$file") -Destination $target
    }
}
$url = ([uri](Join-Path $Destination 'index.html')).AbsoluteUri
$instructions = @"
DAYBREAK IS READY

Your homepage address:
$url

Chrome Home button: Settings > Appearance > Show Home button > Custom address.
Chrome startup: Settings > On startup > Open a specific page > Add a new page.
Paste the address above into each setting. New Tab is configured separately by Chrome.

Use the Daybreak desktop shortcut to open the app any time.
No administrator access, Python or account is needed for the core homepage.
Calendar and GitHub sync are optional; see README.md for setup.

Already using Daybreak at another path? Export a backup from the old page,
then restore it through Settings here. Browsers can keep separate data per file path.
Re-running setup updates this folder while preserving integration caches and credentials.
To uninstall, remove the Daybreak shortcut and this folder after exporting a backup.
"@
[IO.File]::WriteAllText((Join-Path $Destination 'Homepage setup.txt'), $instructions)
if (-not $NoShortcuts) {
    $desktop = $ShortcutDirectory
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut((Join-Path $desktop 'Daybreak.lnk'))
    $shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $Destination 'launch.ps1') + '"'
    $shortcut.WorkingDirectory = $Destination
    $shortcut.Description = 'Daybreak - your daily start'
    $shortcut.IconLocation = (Join-Path $env:SystemRoot 'System32\shell32.dll') + ',13'
    $shortcut.Save()
    $accounts = $shell.CreateShortcut((Join-Path $desktop 'Daybreak Accounts.lnk'))
    $accounts.TargetPath = $shortcut.TargetPath
    $accounts.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $Destination 'launch-accounts.ps1') + '"'
    $accounts.WorkingDirectory = $Destination
    $accounts.Description = 'Connect Google Calendar and GitHub to Daybreak'
    $accounts.IconLocation = $shortcut.IconLocation
    $accounts.Save()
}
Write-Host "Installed in $Destination" -ForegroundColor Green
Write-Host "Homepage address: $url"
Write-Host 'Your Chrome settings have not been changed. Setup instructions are in Homepage setup.txt.'
if (-not $NoLaunch) {
    & (Join-Path $Destination 'launch.ps1')
    Start-Process -FilePath 'notepad.exe' -ArgumentList ('"' + (Join-Path $Destination 'Homepage setup.txt') + '"')
}
