<#
  Prints resume/resume.html to a PDF with headless Chrome.

  resume.html is the source of truth. The old resume lived on artboard 8 of
  PORTFOLIO.ai, which meant editing it needed Illustrator open and a 88MB file;
  this version is text, so it diffs and it is fixable in a minute.

  Output lands on the Desktop next to where the old one lived.
#>

$ErrorActionPreference = 'Stop'

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "Chrome not found at $chrome" }

$src  = Join-Path (Split-Path $PSScriptRoot -Parent) 'resume\resume.html'
$dest = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Shin_Michael_Resume.pdf'
if (-not (Test-Path $src)) { throw "Missing $src" }

# OneDrive redirects the Desktop; prefer that one if it exists.
$oneDrive = Join-Path $env:USERPROFILE 'OneDrive\Desktop'
if (Test-Path $oneDrive) { $dest = Join-Path $oneDrive 'Shin_Michael_Resume.pdf' }

$uri = ([System.Uri](Resolve-Path $src).Path).AbsoluteUri

# Chrome reports "N bytes written" on stderr even on success, and PS 5.1
# turns any native stderr into a terminating error. Start-Process sidesteps it.
$chromeArgs = @(
  '--headless', '--disable-gpu', '--no-pdf-header-footer',
  '--virtual-time-budget=10000',
  ('--print-to-pdf="{0}"' -f $dest),
  $uri
)
Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -NoNewWindow

if (Test-Path $dest) {
  $kb = [math]::Round((Get-Item $dest).Length / 1KB, 1)
  Write-Output ("OK  {0}  ({1} KB)" -f $dest, $kb)
} else {
  throw "Chrome produced no PDF"
}
