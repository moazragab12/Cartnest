#!/bin/bash

# Script for managing database operations
# Usage: ./db.sh [command]

# Move to the script directory
cd "$(dirname "$0")"
# Move to the backend directory
cd ..

# Check if command is provided
if [ $# -eq 0 ]; then
    echo "Usage: ./db.sh [command]"
    echo "Available commands: migrate, seed, refresh, fresh, truncate"
    exit 1
fi

# Run the appropriate command
python database/seeders/refresh_db.py "$1"