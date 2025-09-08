#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getAllJSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item.startsWith('.')) {
      continue;
    }
    
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllJSFiles(fullPath, files);
    } else if (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Get all JS/TS files
const jsFiles = getAllJSFiles('.');

let bundle = `# BETTERISH WEB - COMPLETE CODEBASE
Generated: ${new Date().toISOString()}
Total Files: ${jsFiles.length}

`;

// Add each file
jsFiles.forEach((file, index) => {
  console.log(`Processing ${index + 1}/${jsFiles.length}: ${file}`);
  
  bundle += `\n${'='.repeat(80)}\n`;
  bundle += `FILE ${index + 1}/${jsFiles.length}: ${file}\n`;
  bundle += `${'='.repeat(80)}\n\n`;
  
  try {
    const content = fs.readFileSync(file, 'utf-8');
    bundle += content;
  } catch (error) {
    bundle += `[ERROR READING FILE: ${error.message}]`;
  }
  
  bundle += '\n\n';
});

// Save the bundle
fs.writeFileSync('CODEBASE_BUNDLE.txt', bundle);

const sizeMB = (fs.statSync('CODEBASE_BUNDLE.txt').size / 1024 / 1024).toFixed(2);

console.log(`\n✅ Bundle created: CODEBASE_BUNDLE.txt`);
console.log(`📊 Size: ${sizeMB} MB`);
console.log(`📝 Files: ${jsFiles.length}`);
console.log(`\n🚀 Ready to share with Grok!`);