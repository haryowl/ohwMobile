#!/bin/bash

echo "========================================"
echo "  OHW Mobile - Test Script"
echo "========================================"

echo "✅ Script is running!"

# Check if we're in Termux
if [ -d "/data/data/com.termux" ]; then
    echo "✅ Termux detected"
else
    echo "❌ Not in Termux environment"
    echo "Current directory: $(pwd)"
    echo "Current user: $(whoami)"
    exit 1
fi

echo "✅ Test completed successfully!"
echo "The main script should work now."
