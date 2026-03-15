#!/bin/bash

# Create a simple tomato emoji icon using ImageMagick or sips
# For now, we'll create a placeholder and you can replace with a proper icon later

# Create a simple red square as placeholder for tray icon
cat > tray-icon.svg << 'SVGEOF'
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#e74c3c"/>
  <circle cx="16" cy="8" r="3" fill="#27ae60"/>
</svg>
SVGEOF

echo "✅ Created tray-icon.svg"
echo "⚠️  For production, add proper PNG icons:"
echo "   - tray-icon.png (16x16 or 32x32)"
echo "   - icon.icns (for macOS app)"
