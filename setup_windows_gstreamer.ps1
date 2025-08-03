# PowerShell script to set up GStreamer on Windows

Write-Host "Setting up GStreamer for GameShare on Windows..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "Warning: Running without administrator privileges. Some operations may fail." -ForegroundColor Yellow
}

# Create a temporary directory for downloads
$tempDir = "$env:TEMP\gstreamer_setup"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

Write-Host "`nStep 1: Downloading GStreamer..." -ForegroundColor Cyan

# GStreamer download URLs (1.24.x MSVC version)
$gstreamerRuntime = "https://gstreamer.freedesktop.org/data/pkg/windows/1.24.10/msvc/gstreamer-1.0-msvc-x86_64-1.24.10.msi"
$gstreamerDevel = "https://gstreamer.freedesktop.org/data/pkg/windows/1.24.10/msvc/gstreamer-1.0-devel-msvc-x86_64-1.24.10.msi"

# Download files
Write-Host "Downloading GStreamer runtime..."
$runtimePath = "$tempDir\gstreamer-runtime.msi"
$develPath = "$tempDir\gstreamer-devel.msi"

try {
    Invoke-WebRequest -Uri $gstreamerRuntime -OutFile $runtimePath -UseBasicParsing
    Write-Host "Runtime downloaded successfully" -ForegroundColor Green
    
    Write-Host "Downloading GStreamer development files..."
    Invoke-WebRequest -Uri $gstreamerDevel -OutFile $develPath -UseBasicParsing
    Write-Host "Development files downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "Error downloading GStreamer: $_" -ForegroundColor Red
    Write-Host "`nPlease download manually from:" -ForegroundColor Yellow
    Write-Host "https://gstreamer.freedesktop.org/download/#windows" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nStep 2: Installing GStreamer..." -ForegroundColor Cyan
Write-Host "This will open installer windows. Please follow the installation wizard." -ForegroundColor Yellow

# Install runtime
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $runtimePath -Wait

# Install development files
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $develPath -Wait

Write-Host "`nStep 3: Setting up environment variables..." -ForegroundColor Cyan

# Default GStreamer installation path
$gstreamerPath = "C:\gstreamer\1.0\msvc_x86_64"

if (Test-Path $gstreamerPath) {
    # Set PKG_CONFIG_PATH
    $pkgConfigPath = "$gstreamerPath\lib\pkgconfig"
    [Environment]::SetEnvironmentVariable("PKG_CONFIG_PATH", $pkgConfigPath, [EnvironmentVariableTarget]::User)
    Write-Host "PKG_CONFIG_PATH set to: $pkgConfigPath" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)
    $binPath = "$gstreamerPath\bin"
    if ($currentPath -notlike "*$binPath*") {
        $newPath = "$currentPath;$binPath"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::User)
        Write-Host "Added GStreamer bin to PATH" -ForegroundColor Green
    }
    
    # Set for current session
    $env:PKG_CONFIG_PATH = $pkgConfigPath
    $env:PATH = "$env:PATH;$binPath"
} else {
    Write-Host "Warning: GStreamer not found at expected location: $gstreamerPath" -ForegroundColor Yellow
    Write-Host "Please set PKG_CONFIG_PATH and PATH manually after installation" -ForegroundColor Yellow
}

Write-Host "`nStep 4: Downloading pkg-config..." -ForegroundColor Cyan

# Download pkg-config
$pkgConfigUrl = "https://github.com/pkgconf/pkgconf/releases/download/pkgconf-2.3.0/pkgconf-2.3.0-msvc17.zip"
$pkgConfigZip = "$tempDir\pkgconfig.zip"

try {
    Invoke-WebRequest -Uri $pkgConfigUrl -OutFile $pkgConfigZip -UseBasicParsing
    
    # Extract to a tools directory
    $toolsDir = "$PSScriptRoot\tools"
    if (-not (Test-Path $toolsDir)) {
        New-Item -ItemType Directory -Path $toolsDir | Out-Null
    }
    
    Expand-Archive -Path $pkgConfigZip -DestinationPath $toolsDir -Force
    
    # Create pkg-config.bat wrapper
    $pkgConfigBat = @"
@echo off
"$toolsDir\pkgconf.exe" %*
"@
    Set-Content -Path "$toolsDir\pkg-config.bat" -Value $pkgConfigBat
    
    Write-Host "pkg-config installed to: $toolsDir" -ForegroundColor Green
    Write-Host "Add $toolsDir to your PATH to use pkg-config" -ForegroundColor Yellow
    
    # Add to current session PATH
    $env:PATH = "$env:PATH;$toolsDir"
} catch {
    Write-Host "Warning: Could not download pkg-config: $_" -ForegroundColor Yellow
}

Write-Host "`nStep 5: Verifying installation..." -ForegroundColor Cyan

# Test pkg-config
Write-Host "Testing pkg-config..."
& pkg-config --version

# Test GStreamer
Write-Host "Testing GStreamer..."
& gst-launch-1.0 --version

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "You may need to restart your terminal for all environment changes to take effect." -ForegroundColor Yellow

# Clean up
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue