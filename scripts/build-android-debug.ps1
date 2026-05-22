$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$jdkCandidates = @(
  $env:JAVA_HOME,
  "D:\Android\jbr"
) | ForEach-Object {
  if ($_) {
    ($_ -replace '[^\u0020-\u007E]', '').Trim()
  }
} | Where-Object {
  if (-not $_) {
    return $false
  }
  try {
    Test-Path (Join-Path $_ "bin\java.exe")
  } catch {
    $false
  }
}

$jdkHome = $null
foreach ($candidate in $jdkCandidates) {
  $javaPath = Join-Path $candidate "bin\java.exe"
  $javaOutput = cmd /c "`"$javaPath`" -version 2>&1" | Out-String
  if ($javaOutput -match 'version "21\.') {
    $jdkHome = $candidate
    break
  }
}

if (-not $jdkHome) {
  throw "JDK 21 is required. Install Android Studio/JBR or set JAVA_HOME to a JDK 21 path."
}

$env:JAVA_HOME = $jdkHome
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

if (-not $env:ANDROID_HOME) {
  $defaultSdk = "C:\Users\10250\AppData\Local\Android\Sdk"
  if (Test-Path $defaultSdk) {
    $env:ANDROID_HOME = $defaultSdk
  }
}

if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
  throw "ANDROID_HOME is not set and the default SDK path was not found."
}

Push-Location $projectRoot
try {
  npm run build
  npx cap sync android
  Push-Location "android"
  try {
    .\gradlew.bat assembleDebug --no-daemon
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}
