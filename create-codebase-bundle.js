#!/usr/bin/env node

/**
 * Creates a single file containing all code for AI analysis
 * Excludes node_modules, build files, and binary files
 */

const fs = require('fs').promises;
const path = require('path');

class CodebaseBundler {
  constructor() {
    this.excludeDirs = [
      'node_modules',
      '.next',
      '.git',
      'dist',
      'build',
      'coverage',
      '.vercel',
      'out'
    ];
    
    this.excludeFiles = [
      '.DS_Store',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.env',
      '.env.local'
    ];
    
    this.includeExtensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
      '.md',
      '.css',
      '.scss',
      '.html',
      '.yml',
      '.yaml',
      '.sh',
      '.env.example'
    ];
    
    this.binaryExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.ico',
      '.pdf',
      '.zip',
      '.tar',
      '.gz'
    ];
  }

  async bundle() {
    console.log('📦 Creating codebase bundle for Grok analysis...\n');
    
    let output = `# COMPLETE CODEBASE BUNDLE - BETTERISH WEB
Generated: ${new Date().toISOString()}
Total Files Included: [CALCULATING...]

================================================================================
TABLE OF CONTENTS
================================================================================

`;
    
    const files = await this.getAllFiles('.');
    const validFiles = files.filter(file => this.shouldIncludeFile(file));
    
    // Create table of contents
    validFiles.forEach((file, index) => {
      output += `${index + 1}. ${file}\n`;
    });
    
    output += `\n================================================================================
BEGIN CODE FILES
================================================================================\n\n`;
    
    // Add each file's content
    for (const [index, file] of validFiles.entries()) {
      console.log(`Processing ${index + 1}/${validFiles.length}: ${file}`);
      
      output += `\n================================================================================
FILE ${index + 1}/${validFiles.length}: ${file}
================================================================================\n\n`;
      
      try {
        const content = await fs.readFile(file, 'utf-8');
        output += content;
        output += '\n\n';
      } catch (error) {
        output += `[ERROR READING FILE: ${error.message}]\n\n`;
      }
    }
    
    // Update file count
    output = output.replace('[CALCULATING...]', validFiles.length.toString());
    
    // Save the bundle
    const outputFile = 'CODEBASE_BUNDLE.txt';
    await fs.writeFile(outputFile, output);
    
    // Get file size
    const stats = await fs.stat(outputFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('\n✅ Bundle created successfully!');
    console.log(`📁 File: ${outputFile}`);
    console.log(`📊 Size: ${sizeMB} MB`);
    console.log(`📝 Files included: ${validFiles.length}`);
    
    // Create a summary file
    const summary = {
      generated: new Date().toISOString(),
      totalFiles: validFiles.length,
      bundleSize: `${sizeMB} MB`,
      filesIncluded: validFiles,
      instructions: "Share CODEBASE_BUNDLE.txt with Grok for complete code analysis"
    };
    
    await fs.writeFile('bundle-summary.json', JSON.stringify(summary, null, 2));
    
    return { outputFile, sizeMB, fileCount: validFiles.length };
  }

  async getAllFiles(dir, files = []) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      // Skip excluded directories
      if (this.excludeDirs.includes(item)) {
        continue;
      }
      
      // Skip hidden files/folders (except .env.example)
      if (item.startsWith('.') && item !== '.env.example') {
        continue;
      }
      
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  shouldIncludeFile(file) {
    const basename = path.basename(file);
    const ext = path.extname(file);
    
    // Skip excluded files
    if (this.excludeFiles.includes(basename)) {
      return false;
    }
    
    // Skip binary files
    if (this.binaryExtensions.includes(ext)) {
      return false;
    }
    
    // Skip very large files
    try {
      const stats = require('fs').statSync(file);
      if (stats.size > 1024 * 1024) { // Skip files > 1MB
        return false;
      }
    } catch {
      return false;
    }
    
    // Include if extension is in whitelist
    if (this.includeExtensions.includes(ext)) {
      return true;
    }
    
    // Include if no extension (like LICENSE, README)
    if (!ext && !basename.includes('.')) {
      return true;
    }
    
    return false;
  }
}

// Alternative: Create a GitHub Gist format
async function createGistFormat() {
  console.log('\n📝 Creating GitHub Gist format...\n');
  
  const bundler = new CodebaseBundler();
  const files = await bundler.getAllFiles('.');
  const validFiles = files.filter(file => bundler.shouldIncludeFile(file));
  
  const gistContent = {
    description: "Betterish Web - Complete Codebase for AI Analysis",
    public: false,
    files: {}
  };
  
  for (const file of validFiles.slice(0, 100)) { // Gists have a 100 file limit
    const content = await fs.readFile(file, 'utf-8');
    const safeName = file.replace(/\//g, '_').replace(/\\/g, '_');
    gistContent.files[safeName] = {
      content: content
    };
  }
  
  await fs.writeFile('codebase-gist.json', JSON.stringify(gistContent, null, 2));
  console.log('✅ Gist format saved to codebase-gist.json');
  console.log('📋 You can create a gist at: https://gist.github.com/');
}

// Main execution
async function main() {
  const bundler = new CodebaseBundler();
  
  console.log('🚀 Betterish Web - Codebase Bundler for Grok\n');
  console.log('This tool will create a single file containing all your code.\n');
  
  try {
    const result = await bundler.bundle();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('\n1. Share CODEBASE_BUNDLE.txt with Grok');
    console.log('2. Ask Grok to analyze the complete codebase');
    console.log('3. Request specific insights like:');
    console.log('   - "Review this codebase for security vulnerabilities"');
    console.log('   - "Identify code smells and refactoring opportunities"');
    console.log('   - "Suggest performance optimizations"');
    console.log('   - "Find potential bugs and edge cases"');
    console.log('   - "Recommend architectural improvements"');
    
    if (result.sizeMB > 10) {
      console.log('\n⚠️  WARNING: Bundle is large (>10MB). You might need to:');
      console.log('   - Split into multiple parts');
      console.log('   - Use a file sharing service');
      console.log('   - Create a GitHub repository');
    }
    
    // Optionally create gist format
    if (result.fileCount < 100) {
      console.log('\n💡 TIP: Your codebase is small enough for a GitHub Gist.');
      console.log('   Run with --gist flag to create gist format.');
    }
    
  } catch (error) {
    console.error('❌ Error creating bundle:', error);
    process.exit(1);
  }
}

// Check for --gist flag
if (process.argv.includes('--gist')) {
  createGistFormat().catch(console.error);
} else {
  main().catch(console.error);
}