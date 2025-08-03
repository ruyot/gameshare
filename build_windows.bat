@echo off
echo Building GameShare for Windows with GStreamer support...
echo.

REM Check if cargo is installed
where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Rust/Cargo is not installed or not in PATH
    echo Please install Rust from https://rustup.rs/
    exit /b 1
)

REM Set PKG_CONFIG_PATH for GStreamer (adjust path as needed)
REM Common GStreamer installation paths on Windows
if exist "C:\gstreamer\1.0\x86_64\lib\pkgconfig" (
    set PKG_CONFIG_PATH=C:\gstreamer\1.0\x86_64\lib\pkgconfig
    echo Found GStreamer at C:\gstreamer\1.0\x86_64
) else if exist "C:\gstreamer\1.0\msvc_x86_64\lib\pkgconfig" (
    set PKG_CONFIG_PATH=C:\gstreamer\1.0\msvc_x86_64\lib\pkgconfig
    echo Found GStreamer at C:\gstreamer\1.0\msvc_x86_64
) else (
    echo Warning: GStreamer not found at default locations
    echo Please install GStreamer from https://gstreamer.freedesktop.org/download/
    echo And set PKG_CONFIG_PATH to point to the pkgconfig directory
)

REM Build the project
echo.
echo Building GameShare...
cargo build --release

if %errorlevel% neq 0 (
    echo.
    echo Build failed!
    echo.
    echo If you're getting GStreamer-related errors:
    echo 1. Install GStreamer development packages from https://gstreamer.freedesktop.org/download/
    echo 2. Install pkg-config for Windows
    echo 3. Set PKG_CONFIG_PATH environment variable to GStreamer's pkgconfig directory
    echo.
    exit /b 1
)

echo.
echo Build successful!
echo.
echo To run GameShare with GStreamer:
echo   target\release\gameshare-host.exe --use-gstreamer --window-title "Your Game"
echo.