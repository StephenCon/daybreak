param([switch]$NoLaunch)
$ErrorActionPreference = 'Stop'
$entry = Join-Path $PSScriptRoot 'index.html'
if (-not (Test-Path -LiteralPath $entry)) { throw 'Daybreak files are missing. Run Install Daybreak again.' }
foreach ($name in @('calendar-data.js', 'github-data.js')) {
    $target = Join-Path $PSScriptRoot $name
    if (-not (Test-Path -LiteralPath $target)) {
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot "templates\$name") -Destination $target
    }
}
$chromePaths = @(@($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA) |
    Where-Object { $_ } | ForEach-Object { Join-Path $_ 'Google\Chrome\Application\chrome.exe' })
foreach ($key in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe')) {
    if (Test-Path $key) { $chromePaths += (Get-ItemProperty $key).'(default)' }
}
$chrome = $chromePaths | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } | Select-Object -First 1
$url = ([uri]$entry).AbsoluteUri
if ($NoLaunch) { return $url }
if ($chrome) { Start-Process -FilePath $chrome -ArgumentList ('"' + $url + '"') }
else { Start-Process -FilePath $entry }
