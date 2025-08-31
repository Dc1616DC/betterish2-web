// Generate PWA icons from a base design
// This creates simple colored icons for now - can be replaced with proper designs later

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that we can convert to different sizes
const createBaseSVG = () => {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#2563eb" stroke="#1d4ed8" stroke-width="8"/>
  
  <!-- Letter "B" for Betterish -->
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" font-weight="bold" 
        text-anchor="middle" fill="white">B</text>
  
  <!-- Small dot accent -->
  <circle cx="380" cy="180" r="24" fill="#60a5fa"/>
</svg>`;
};

// Icon sizes we need based on manifest.json and layout.js references
const iconSizes = [
  16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');
  
  // Create icons directory if it doesn't exist
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Create the base SVG
  const svgContent = createBaseSVG();
  fs.writeFileSync(path.join(iconsDir, 'icon-base.svg'), svgContent);
  
  console.log('📝 Base SVG created');
  
  // For now, we'll create placeholder PNGs using a simple approach
  // In a real implementation, you'd use a library like sharp or canvas to convert SVG to PNG
  
  console.log('📱 Creating icon placeholders...');
  
  // Create a simple script that uses imagemagick if available, otherwise creates placeholder files
  const createIconScript = `#!/bin/bash
# Icon generation script

ICONS_DIR="${iconsDir}"
BASE_SVG="$ICONS_DIR/icon-base.svg"

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "📷 Using ImageMagick to generate PNGs..."
    ${iconSizes.map(size => 
      `convert "$BASE_SVG" -resize ${size}x${size} "$ICONS_DIR/icon-${size}x${size}.png"`
    ).join('\n    ')}
    echo "✅ Icons generated successfully!"
else
    echo "⚠️  ImageMagick not found. Creating placeholder files..."
    ${iconSizes.map(size => 
      `echo "PNG placeholder ${size}x${size}" > "$ICONS_DIR/icon-${size}x${size}.png"`
    ).join('\n    ')}
    echo "📝 Placeholder files created. Install ImageMagick for proper icons."
fi
`;

  fs.writeFileSync(path.join(__dirname, 'generate-icons.sh'), createIconScript);
  fs.chmodSync(path.join(__dirname, 'generate-icons.sh'), '755');
  
  console.log('🚀 Icon generation script created');
  console.log('Run: cd scripts && ./generate-icons.sh');
  
  return true;
}

generateIcons().then(() => {
  console.log('✅ Icon generation setup complete');
}).catch(err => {
  console.error('❌ Error:', err);
});