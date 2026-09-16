param([Parameter(Mandatory=$true)][string]$TestRoot)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$target = Join-Path $TestRoot 'Daybreak with spaces'
$shortcuts = Join-Path $TestRoot 'Desktop'
New-Item -ItemType Directory -Path $shortcuts -Force | Out-Null
& (Join-Path $repo 'install.ps1') -Destination $target -ShortcutDirectory $shortcuts -NoLaunch
foreach ($name in @('index.html','calendar-data.js','github-data.js','Homepage setup.txt','launch.ps1')) {
    if (-not (Test-Path -LiteralPath (Join-Path $target $name))) { throw "Missing installed file: $name" }
}
foreach ($name in @('accounts.js','accounts_page.py','github-login.py','Connect accounts.cmd','launch-accounts.ps1')) {
    if (-not (Test-Path -LiteralPath (Join-Path $target $name))) { throw "Missing account setup file: $name" }
}
if (-not (Test-Path -LiteralPath (Join-Path $shortcuts 'Daybreak Accounts.lnk'))) { throw 'Missing accounts shortcut' }
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $shortcuts 'Daybreak.lnk'))
if ($shortcut.Arguments -notlike '*-File "*Daybreak with spaces\launch.ps1"') { throw 'Shortcut quoting failed' }
$url = & (Join-Path $target 'launch.ps1') -NoLaunch
if (-not $url.StartsWith('file:///') -or $url -notlike '*Daybreak%20with%20spaces/index.html') { throw 'Launch URL is invalid' }
$sentinels = @{'calendar-data.js'='test-calendar'; 'github-data.js'='test-issues'; '.calendar-credentials'='fake-test-vault'; 'weather-config.js'='test-location'}
foreach ($name in $sentinels.Keys) { [IO.File]::WriteAllText((Join-Path $target $name), $sentinels[$name]) }
[IO.File]::WriteAllText((Join-Path $target 'themes.js'), 'outdated')
& (Join-Path $repo 'install.ps1') -Destination $target -NoShortcuts -NoLaunch
foreach ($name in $sentinels.Keys) {
    if ([IO.File]::ReadAllText((Join-Path $target $name)) -ne $sentinels[$name]) { throw "Update overwrote user data: $name" }
}
if ([IO.File]::ReadAllText((Join-Path $target 'themes.js')) -eq 'outdated') { throw 'Application update failed' }
if (Test-Path -LiteralPath (Join-Path $target '.git')) { throw 'Installer copied repository internals' }
Write-Host 'PASS: clean install, shortcut quoting, Chrome file URL, update and private data preservation'
