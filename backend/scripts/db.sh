#!/bin/bash

# Script for managing database operations
# Usage: ./db.sh [command]

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Get the absolute path of the backend directory (parent of script dir)
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the backend directory using absolute path
cd "$BACKEND_DIR"

# Check if command is provided
if [ $# -eq 0 ]; then
    echo "Usage: ./db.sh [command]"
    echo "Available commands: migrate, seed, refresh, fresh, truncate"
    exit 1
fi

# Run the appropriate command with python using absolute path
python "$BACKEND_DIR/database/seeders/refresh_db.py" "$1"