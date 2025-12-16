#!/bin/bash
echo "Setting up Video Captions App..."

# check if python3 exists
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 could not be found. Please install Python 3.10+."
    exit 1
fi

# Create venv if not exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Upgrade pip just in case
pip install --upgrade pip

# Run the python automation script
python run_local.py
