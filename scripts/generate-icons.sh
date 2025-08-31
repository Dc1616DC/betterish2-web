#!/bin/bash
# Icon generation script

ICONS_DIR="/Users/danielchase/betterish-web/public/icons"
BASE_SVG="$ICONS_DIR/icon-base.svg"

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "📷 Using ImageMagick to generate PNGs..."
    convert "$BASE_SVG" -resize 16x16 "$ICONS_DIR/icon-16x16.png"
    convert "$BASE_SVG" -resize 32x32 "$ICONS_DIR/icon-32x32.png"
    convert "$BASE_SVG" -resize 72x72 "$ICONS_DIR/icon-72x72.png"
    convert "$BASE_SVG" -resize 96x96 "$ICONS_DIR/icon-96x96.png"
    convert "$BASE_SVG" -resize 128x128 "$ICONS_DIR/icon-128x128.png"
    convert "$BASE_SVG" -resize 144x144 "$ICONS_DIR/icon-144x144.png"
    convert "$BASE_SVG" -resize 152x152 "$ICONS_DIR/icon-152x152.png"
    convert "$BASE_SVG" -resize 180x180 "$ICONS_DIR/icon-180x180.png"
    convert "$BASE_SVG" -resize 192x192 "$ICONS_DIR/icon-192x192.png"
    convert "$BASE_SVG" -resize 384x384 "$ICONS_DIR/icon-384x384.png"
    convert "$BASE_SVG" -resize 512x512 "$ICONS_DIR/icon-512x512.png"
    echo "✅ Icons generated successfully!"
else
    echo "⚠️  ImageMagick not found. Creating placeholder files..."
    echo "PNG placeholder 16x16" > "$ICONS_DIR/icon-16x16.png"
    echo "PNG placeholder 32x32" > "$ICONS_DIR/icon-32x32.png"
    echo "PNG placeholder 72x72" > "$ICONS_DIR/icon-72x72.png"
    echo "PNG placeholder 96x96" > "$ICONS_DIR/icon-96x96.png"
    echo "PNG placeholder 128x128" > "$ICONS_DIR/icon-128x128.png"
    echo "PNG placeholder 144x144" > "$ICONS_DIR/icon-144x144.png"
    echo "PNG placeholder 152x152" > "$ICONS_DIR/icon-152x152.png"
    echo "PNG placeholder 180x180" > "$ICONS_DIR/icon-180x180.png"
    echo "PNG placeholder 192x192" > "$ICONS_DIR/icon-192x192.png"
    echo "PNG placeholder 384x384" > "$ICONS_DIR/icon-384x384.png"
    echo "PNG placeholder 512x512" > "$ICONS_DIR/icon-512x512.png"
    echo "📝 Placeholder files created. Install ImageMagick for proper icons."
fi
