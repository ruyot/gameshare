#!/bin/bash

# GameShare Test Setup Script
# This script helps set up a test environment for GameShare with SuperTuxKart

set -e

echo "🎮 GameShare Test Setup Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "This script is designed for Linux systems only"
    exit 1
fi

print_status "Checking system requirements..."

# Check if X11 is available
if [ -z "$DISPLAY" ]; then
    print_error "X11 DISPLAY not set. Please run in a graphical session"
    exit 1
fi
print_status "X11 display detected: $DISPLAY"

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    print_warning "FFmpeg not found. Installing..."
    sudo apt update
    sudo apt install -y ffmpeg
fi
print_status "FFmpeg is available"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo not found. Please install Rust from https://rustup.rs/"
    exit 1
fi
print_status "Rust/Cargo is available"

# Check uinput permissions
if [ ! -w /dev/uinput ]; then
    print_warning "/dev/uinput is not writable"
    echo "You have two options:"
    echo "  1. Run GameShare with sudo (not recommended for production)"
    echo "  2. Add your user to the input group (recommended):"
    echo "     sudo usermod -a -G input $USER"
    echo "     sudo udevadm control --reload-rules"
    echo "     Then log out and back in"
    echo ""
    read -p "Would you like to add your user to the input group now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo usermod -a -G input $USER
        sudo udevadm control --reload-rules
        print_status "User added to input group. Please log out and back in for changes to take effect"
    fi
else
    print_status "uinput permissions are correct"
fi

# Check if SuperTuxKart is installed
if ! command -v supertuxkart &> /dev/null; then
    print_warning "SuperTuxKart not found. Installing..."
    sudo apt update
    sudo apt install -y supertuxkart
fi
print_status "SuperTuxKart is available"

# Check for NVIDIA GPU (optional)
if command -v nvidia-smi &> /dev/null; then
    print_status "NVIDIA GPU detected - hardware encoding available"
else
    print_warning "NVIDIA GPU not detected - will use software encoding"
fi

# Build GameShare
print_status "Building GameShare..."
cargo build --release

if [ $? -eq 0 ]; then
    print_status "Build successful!"
else
    print_error "Build failed. Please check the errors above"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To test GameShare:"
echo "1. Start SuperTuxKart: supertuxkart"
echo "2. In another terminal, run: cargo run --release -- --process-name supertuxkart"
echo "3. Open client/index.html in a web browser"
echo "4. Connect using session ID 'test-session'"
echo ""
echo "For more options, see: cargo run --release -- --help" 