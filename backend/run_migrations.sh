#!/bin/bash
# Helper script to run migration scripts with proper Python environment

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
    PYTHON_CMD="python"
else
    echo "No virtual environment found, using python3..."
    PYTHON_CMD="python3"
fi

# Run migrations
echo "Running migration: migrate_add_library_tables.py"
$PYTHON_CMD migrate_add_library_tables.py

echo ""
echo "Running migration: migrate_add_favorite_unique_constraint.py"
$PYTHON_CMD migrate_add_favorite_unique_constraint.py

echo ""
echo "✅ All migrations complete!"

