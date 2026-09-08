param(
  [ValidateSet('inspect', 'tap', 'scrollTo')][string]$Action = 'inspect',
  [string]$Selector = '',
  [string]$Checkpoint = ''
)
$ErrorActionPreference = 'Stop'

function Read-BraveUi {
  $dumpOutput = (& adb shell uiautomator dump /sdcard/braveline-window.xml) -join "`n"
  if ($LASTEXITCODE -ne 0 -or $dumpOutput -notmatch 'dumped to:') { throw "UI dump failed: $dumpOutput" }
  $xmlText = (& adb shell cat /sdcard/braveline-window.xml) -join "`n"
  return [xml]$xmlText
}

function Get-Target($Ui, [string]$Value) {
  return @($Ui.SelectNodes('//node') | Where-Object {
    $matchesValue = $_.'resource-id' -ceq $Value -or $_.'content-desc' -ceq $Value -or $_.text -ceq $Value
    $visible = $_.bounds -match '^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$' -and
      [int]$Matches[3] -gt [int]$Matches[1] -and [int]$Matches[4] -gt [int]$Matches[2]
    $matchesValue -and $visible
  })
}

function Get-Rectangle($Node) {
  if ($Node.bounds -notmatch '^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$') { throw 'Missing observed bounds' }
  return @([int]$Matches[1], [int]$Matches[2], [int]$Matches[3], [int]$Matches[4])
}

$ui = Read-BraveUi
if ($Action -eq 'scrollTo') {
  for ($attempt = 0; $attempt -lt 5; $attempt++) {
    if (@(Get-Target $ui $Selector).Count -gt 0) { break }
    $scrollers = @($ui.SelectNodes('//node') | Where-Object { $_.scrollable -eq 'true' })
    if ($scrollers.Count -eq 0) { throw 'No observed scroll container' }
    $r = Get-Rectangle $scrollers[-1]
    $x = [int](($r[0] + $r[2]) / 2)
    $startY = [int]($r[1] + ($r[3] - $r[1]) * 0.84)
    $endY = [int]($r[1] + ($r[3] - $r[1]) * 0.24)
    & adb shell input swipe $x $startY $x $endY 450
    $ui = Read-BraveUi
  }
  if (@(Get-Target $ui $Selector).Count -eq 0) { throw "Target not found after scrolling: $Selector" }
}
if ($Action -eq 'tap') {
  $targets = @(Get-Target $ui $Selector)
  if ($targets.Count -ne 1) { throw "Expected exactly one observed target: $Selector; got $($targets.Count)" }
  $target = $targets[0]
  if ($target.enabled -ne 'true') { throw "Target disabled: $Selector" }
  $r = Get-Rectangle $target
  if ($r[2] -le $r[0] -or $r[3] -le $r[1]) { throw 'Target has no visible area' }
  & adb shell input tap ([int](($r[0] + $r[2]) / 2)) ([int](($r[1] + $r[3]) / 2))
  Write-Output "Tapped observed target: $Selector"
  $ui = Read-BraveUi
}
if ($Checkpoint) {
  $targetXml = Join-Path $PSScriptRoot "$Checkpoint.xml"
  & adb pull /sdcard/braveline-window.xml $targetXml | Out-Null
  $targetPng = Join-Path $PSScriptRoot "$Checkpoint.png"
  & adb shell screencap -p /sdcard/braveline-checkpoint.png
  & adb pull /sdcard/braveline-checkpoint.png $targetPng | Out-Null
}
$ui.SelectNodes('//node') | Where-Object {
  $_.text -or $_.'content-desc' -or $_.'resource-id'
} | Select-Object text, @{n='id';e={$_.'resource-id'}}, @{n='label';e={$_.'content-desc'}}, bounds, enabled | ConvertTo-Json -Depth 2
