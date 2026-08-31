#!/bin/bash
# ==============================================================================
# S-Bot Restaurant & Admin Dashboard - VPS Auto Setup Script (SPanel / Ubuntu / Debian)
# ==============================================================================

set -e

echo "========================================================"
echo "🚀 Installing S-Bot Restaurant & Admin Dashboard on VPS"
echo "========================================================"

# 1. Update system & install Python & Node if not present
echo "📦 Checking Python & Virtualenv..."
sudo apt update -y
sudo apt install -y python3 python3-pip python3-venv

# 2. Create Virtual Environment
echo "🐍 Setting up Python Virtual Environment..."
cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# 3. Install Python Dependencies
echo "📥 Installing Backend Dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Initialize Database & Seed Restaurant Data
echo "🌱 Initializing Database..."
cd backend
python seed_data.py
cd ..

# 5. Make log directory
mkdir -p logs
mkdir -p backend/uploads

echo "========================================================"
echo "✅ Setup Complete!"
echo "To run backend in background with Systemd or PM2, check DEPLOYMENT_GUIDE_SPANEL.md"
echo "========================================================"
