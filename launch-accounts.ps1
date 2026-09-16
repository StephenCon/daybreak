$ErrorActionPreference = 'Stop'
$python = Get-Command py.exe -ErrorAction SilentlyContinue
$arguments = @('-3')
if (-not $python) { $python = Get-Command python.exe -ErrorAction SilentlyContinue; $arguments = @() }
if (-not $python) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show('Install Python 3 from https://www.python.org/downloads/windows/ then run Connect accounts again.', 'Daybreak needs Python') | Out-Null
    exit 1
}
$arguments += '"' + (Join-Path $PSScriptRoot 'calendar-helper.py') + '"'
$arguments += '--setup'
Start-Process -FilePath $python.Source -ArgumentList $arguments -WindowStyle Hidden
