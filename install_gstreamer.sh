#!/bin/bash

# Install GStreamer dependencies for Ubuntu/Debian
echo "Installing GStreamer development packages..."

# Update package list
sudo apt update

# Install GStreamer base packages
sudo apt install -y \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-bad1.0-dev \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools

# Install GStreamer WebRTC plugin (most important for your use case)
sudo apt install -y \
    gstreamer1.0-nice \
    libgstwebrtc-1.0-0 \
    libgstwebrtc-1.0-dev \
    gstreamer1.0-pulseaudio

# Install additional useful plugins
sudo apt install -y \
    gstreamer1.0-x \
    gstreamer1.0-gl \
    gstreamer1.0-gtk3

# For screen capture on Linux
sudo apt install -y \
    gstreamer1.0-plugins-base-apps

# Verify installation
echo "Verifying GStreamer installation..."
pkg-config --modversion gstreamer-1.0
pkg-config --modversion gstreamer-webrtc-1.0

echo "GStreamer installation complete!"