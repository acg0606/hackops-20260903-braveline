param(
  [Parameter(Mandatory = $true)][string]$PlanPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [string]$Ffmpeg = 'ffmpeg'
)

$ErrorActionPreference = 'Stop'
$bravePlanFile = (Resolve-Path -LiteralPath $PlanPath).Path
$bravePlan = Get-Content -Raw -LiteralPath $bravePlanFile | ConvertFrom-Json
$braveBase = Split-Path -Parent $bravePlanFile
$braveSegments = @($bravePlan.clips)
if ($braveSegments.Count -eq 0) { throw 'At least one real screen-recording clip is required.' }
$braveDuration = ($braveSegments | Measure-Object -Property seconds -Sum).Sum
if ($braveDuration -ge 120) { throw 'Essential footage must remain below two minutes.' }
if (Test-Path -LiteralPath $OutputPath) { throw 'Refusing to overwrite an existing final video.' }

# Text is drawn below, never over, the actual app footage. No screen is fabricated.
function ConvertTo-BraveFilterText([string]$Text) {
  if ($Text -match "[\\:'\r\n%]") { throw 'Use simple caption text without filter-control characters.' }
  return $Text
}

$braveInputs = @()
$braveFilters = @()
$braveLabels = @()
for ($braveIndex = 0; $braveIndex -lt $braveSegments.Count; $braveIndex++) {
  $braveClip = $braveSegments[$braveIndex]
  $braveSource = (Resolve-Path -LiteralPath (Join-Path $braveBase $braveClip.file)).Path
  if ([IO.Path]::GetExtension($braveSource) -ne '.mp4') { throw 'Inputs must be original MP4 screen recordings.' }
  $braveInputs += @('-ss', [string]$braveClip.start, '-t', [string]$braveClip.seconds, '-i', $braveSource)
  $braveHeadline = ConvertTo-BraveFilterText $braveClip.headline
  $braveDetail = ConvertTo-BraveFilterText $braveClip.detail
  $braveFilters += "[$($braveIndex):v:0]setpts=PTS-STARTPTS,fps=24,scale=-2:2136,pad=1080:2340:(ow-iw)/2:16:0xfaf8e9,setsar=1,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='$braveHeadline':fontsize=42:fontcolor=0x24123d:x=40:y=2172,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$braveDetail':fontsize=29:fontcolor=0x51475f:x=40:y=2235,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Android emulator | Real screen recording | Silent demo':fontsize=26:fontcolor=0x51475f:x=40:y=2287[v$braveIndex]"
  $braveLabels += "[v$braveIndex]"
}
$braveFilters += "$($braveLabels -join '')concat=n=$($braveSegments.Count):v=1:a=0[outv]"
$braveArguments = @('-hide_banner', '-loglevel', 'warning') + $braveInputs + @('-filter_complex', ($braveFilters -join ';'), '-map', '[outv]', '-an', '-c:v', 'libx264', '-threads', '2', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', $OutputPath)
& $Ffmpeg @braveArguments
if ($LASTEXITCODE -ne 0) { throw "Video render failed with exit code $LASTEXITCODE" }
$braveRendered = Get-Item -LiteralPath $OutputPath
[pscustomobject]@{
  path = $braveRendered.FullName
  bytes = $braveRendered.Length
  plannedDurationSeconds = $braveDuration
  sha256 = (Get-FileHash -LiteralPath $OutputPath -Algorithm SHA256).Hash
  provenance = 'Edited and captioned real Android screen recordings; no generated app screens or audio.'
} | ConvertTo-Json
