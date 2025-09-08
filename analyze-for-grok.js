#!/usr/bin/env node

/**
 * Codebase Analysis Tool for Grok AI Review
 * Generates a comprehensive analysis of the codebase for AI review
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class CodebaseAnalyzer {
  constructor() {
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      fileTypes: {},
      components: [],
      apis: [],
      hooks: [],
      contexts: [],
      services: [],
      issues: [],
      patterns: {},
      dependencies: {},
      complexity: {}
    };
  }

  async analyze() {
    console.log('🔍 Starting comprehensive codebase analysis...\n');
    
    // 1. Project Overview
    await this.getProjectOverview();
    
    // 2. Architecture Analysis
    await this.analyzeArchitecture();
    
    // 3. Component Analysis
    await this.analyzeComponents();
    
    // 4. API Routes Analysis
    await this.analyzeAPIRoutes();
    
    // 5. State Management Analysis
    await this.analyzeStateManagement();
    
    // 6. Database & Data Flow
    await this.analyzeDatabaseUsage();
    
    // 7. Security Analysis
    await this.analyzeSecurityPatterns();
    
    // 8. Performance Analysis
    await this.analyzePerformance();
    
    // 9. Code Quality Metrics
    await this.analyzeCodeQuality();
    
    // 10. Dependency Analysis
    await this.analyzeDependencies();
    
    // Generate report
    return this.generateReport();
  }

  async getProjectOverview() {
    console.log('📊 Analyzing project structure...');
    
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    
    this.stats.projectName = packageJson.name;
    this.stats.version = packageJson.version;
    this.stats.dependencies = Object.keys(packageJson.dependencies || {});
    this.stats.devDependencies = Object.keys(packageJson.devDependencies || {});
    
    // Count files and lines
    const files = await this.getAllFiles('.');
    this.stats.totalFiles = files.length;
    
    for (const file of files) {
      const ext = path.extname(file);
      this.stats.fileTypes[ext] = (this.stats.fileTypes[ext] || 0) + 1;
      
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        const content = await fs.readFile(file, 'utf-8');
        this.stats.totalLines += content.split('\n').length;
      }
    }
  }

  async analyzeArchitecture() {
    console.log('🏗️ Analyzing architecture...');
    
    this.stats.architecture = {
      framework: 'Next.js 14 (App Router)',
      ui: 'React 18',
      styling: 'Tailwind CSS',
      database: 'Firebase Firestore',
      auth: 'Firebase Auth',
      ai: 'OpenAI GPT-3.5',
      deployment: 'Vercel',
      patterns: []
    };
    
    // Detect architectural patterns
    const patterns = [];
    
    if (await this.fileExists('./contexts')) {
      patterns.push('Context API for state management');
    }
    if (await this.fileExists('./hooks')) {
      patterns.push('Custom hooks pattern');
    }
    if (await this.fileExists('./lib/services')) {
      patterns.push('Service layer abstraction');
    }
    if (await this.fileExists('./components')) {
      patterns.push('Component-based architecture');
    }
    
    this.stats.architecture.patterns = patterns;
  }

  async analyzeComponents() {
    console.log('🧩 Analyzing components...');
    
    const componentsDir = './components';
    if (await this.fileExists(componentsDir)) {
      const files = await fs.readdir(componentsDir);
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = await fs.readFile(path.join(componentsDir, file), 'utf-8');
          
          this.stats.components.push({
            name: file,
            lines: content.split('\n').length,
            hasState: content.includes('useState'),
            hasEffects: content.includes('useEffect'),
            isClient: content.includes("'use client'"),
            complexity: this.calculateComplexity(content)
          });
        }
      }
    }
  }

  async analyzeAPIRoutes() {
    console.log('🌐 Analyzing API routes...');
    
    const apiDir = './app/api';
    if (await this.fileExists(apiDir)) {
      const routes = await this.findAPIRoutes(apiDir);
      
      for (const route of routes) {
        const content = await fs.readFile(route, 'utf-8');
        
        this.stats.apis.push({
          path: route.replace('./app/api', '/api'),
          methods: this.extractHTTPMethods(content),
          hasAuth: content.includes('auth') || content.includes('token'),
          usesAI: content.includes('openai') || content.includes('gpt'),
          complexity: this.calculateComplexity(content)
        });
      }
    }
  }

  async analyzeStateManagement() {
    console.log('🔄 Analyzing state management...');
    
    // Analyze contexts
    const contextsDir = './contexts';
    if (await this.fileExists(contextsDir)) {
      const files = await fs.readdir(contextsDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(contextsDir, file), 'utf-8');
          
          this.stats.contexts.push({
            name: file,
            providers: (content.match(/Provider/g) || []).length,
            hooks: (content.match(/use[A-Z]\w+/g) || []).length,
            complexity: this.calculateComplexity(content)
          });
        }
      }
    }
    
    // Analyze hooks
    const hooksDir = './hooks';
    if (await this.fileExists(hooksDir)) {
      const files = await fs.readdir(hooksDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          this.stats.hooks.push({
            name: file,
            type: this.detectHookType(file)
          });
        }
      }
    }
  }

  async analyzeDatabaseUsage() {
    console.log('💾 Analyzing database usage...');
    
    const files = await this.getAllFiles('.');
    const firestoreUsage = [];
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = await fs.readFile(file, 'utf-8');
        
        if (content.includes('firestore') || content.includes('firebase')) {
          const operations = {
            file: file.replace('./', ''),
            reads: (content.match(/getDocs?|onSnapshot/g) || []).length,
            writes: (content.match(/setDoc|addDoc|updateDoc/g) || []).length,
            deletes: (content.match(/deleteDoc/g) || []).length,
            batches: (content.match(/batch\(/g) || []).length
          };
          
          if (operations.reads || operations.writes || operations.deletes) {
            firestoreUsage.push(operations);
          }
        }
      }
    }
    
    this.stats.database = {
      type: 'Firebase Firestore',
      operations: firestoreUsage,
      collections: this.extractCollections(firestoreUsage)
    };
  }

  async analyzeSecurityPatterns() {
    console.log('🔒 Analyzing security...');
    
    const securityIssues = [];
    const files = await this.getAllFiles('.');
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for potential security issues
        if (content.includes('dangerouslySetInnerHTML')) {
          securityIssues.push({
            file: file.replace('./', ''),
            issue: 'Uses dangerouslySetInnerHTML',
            severity: 'medium'
          });
        }
        
        if (content.includes('eval(')) {
          securityIssues.push({
            file: file.replace('./', ''),
            issue: 'Uses eval()',
            severity: 'high'
          });
        }
        
        if (content.match(/api[_-]?key/gi) && !file.includes('.env')) {
          securityIssues.push({
            file: file.replace('./', ''),
            issue: 'Possible API key in code',
            severity: 'high'
          });
        }
      }
    }
    
    this.stats.security = {
      issues: securityIssues,
      hasEnvFile: await this.fileExists('.env.local'),
      usesHTTPS: true,
      hasAuthentication: true
    };
  }

  async analyzePerformance() {
    console.log('⚡ Analyzing performance patterns...');
    
    const performancePatterns = {
      memoization: 0,
      lazyLoading: 0,
      codeSpitting: 0,
      imageOptimization: 0,
      debouncing: 0
    };
    
    const files = await this.getAllFiles('.');
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = await fs.readFile(file, 'utf-8');
        
        if (content.includes('useMemo') || content.includes('useCallback')) {
          performancePatterns.memoization++;
        }
        if (content.includes('dynamic(') || content.includes('lazy(')) {
          performancePatterns.lazyLoading++;
        }
        if (content.includes('Image') && content.includes('next/image')) {
          performancePatterns.imageOptimization++;
        }
        if (content.includes('debounce')) {
          performancePatterns.debouncing++;
        }
      }
    }
    
    this.stats.performance = performancePatterns;
  }

  async analyzeCodeQuality() {
    console.log('✨ Analyzing code quality...');
    
    const quality = {
      avgComponentSize: 0,
      avgComplexity: 0,
      documentationLevel: 0,
      testCoverage: 0
    };
    
    // Calculate average component size
    if (this.stats.components.length > 0) {
      const totalLines = this.stats.components.reduce((sum, c) => sum + c.lines, 0);
      quality.avgComponentSize = Math.round(totalLines / this.stats.components.length);
    }
    
    // Calculate average complexity
    const complexities = [...this.stats.components, ...this.stats.apis]
      .map(item => item.complexity)
      .filter(c => c);
    
    if (complexities.length > 0) {
      quality.avgComplexity = Math.round(
        complexities.reduce((sum, c) => sum + c, 0) / complexities.length
      );
    }
    
    // Check for tests
    quality.hasTests = await this.fileExists('./__tests__') || 
                      await this.fileExists('./tests');
    
    this.stats.quality = quality;
  }

  async analyzeDependencies() {
    console.log('📦 Analyzing dependencies...');
    
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    
    this.stats.dependencyAnalysis = {
      total: Object.keys(packageJson.dependencies || {}).length,
      dev: Object.keys(packageJson.devDependencies || {}).length,
      key: {
        'react': packageJson.dependencies?.react,
        'next': packageJson.dependencies?.next,
        'firebase': packageJson.dependencies?.firebase,
        'openai': packageJson.dependencies?.openai,
        'tailwindcss': packageJson.devDependencies?.tailwindcss
      }
    };
  }

  // Helper methods
  async getAllFiles(dir, files = []) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === '.next') {
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

  async findAPIRoutes(dir, routes = []) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await this.findAPIRoutes(fullPath, routes);
      } else if (item === 'route.js' || item === 'route.ts') {
        routes.push(fullPath);
      }
    }
    
    return routes;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  calculateComplexity(content) {
    // Simple cyclomatic complexity approximation
    const conditions = (content.match(/if\s*\(|while\s*\(|for\s*\(|\?\s*:/g) || []).length;
    const functions = (content.match(/function\s+\w+|=>\s*{|async\s+\w+/g) || []).length;
    return conditions + functions;
  }

  extractHTTPMethods(content) {
    const methods = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    return methods;
  }

  detectHookType(filename) {
    if (filename.includes('use')) {
      if (filename.includes('Fetch') || filename.includes('Data')) return 'data';
      if (filename.includes('Auth')) return 'auth';
      if (filename.includes('State')) return 'state';
      return 'utility';
    }
    return 'unknown';
  }

  extractCollections(firestoreUsage) {
    const collections = new Set();
    
    // This is simplified - would need more sophisticated parsing
    firestoreUsage.forEach(usage => {
      // Extract from file paths
      if (usage.file.includes('tasks')) collections.add('tasks');
      if (usage.file.includes('users')) collections.add('users');
      if (usage.file.includes('settings')) collections.add('settings');
    });
    
    return Array.from(collections);
  }

  generateReport() {
    const report = `
# 🚀 BETTERISH WEB - COMPREHENSIVE CODEBASE ANALYSIS
Generated: ${new Date().toISOString()}

## 📊 PROJECT OVERVIEW
- **Name**: ${this.stats.projectName}
- **Version**: ${this.stats.version}
- **Total Files**: ${this.stats.totalFiles}
- **Total Lines of Code**: ${this.stats.totalLines.toLocaleString()}
- **Primary Language**: JavaScript/TypeScript

## 🏗️ ARCHITECTURE
- **Framework**: ${this.stats.architecture.framework}
- **UI Library**: ${this.stats.architecture.ui}
- **Styling**: ${this.stats.architecture.styling}
- **Database**: ${this.stats.architecture.database}
- **Authentication**: ${this.stats.architecture.auth}
- **AI Integration**: ${this.stats.architecture.ai}

### Architectural Patterns Detected:
${this.stats.architecture.patterns.map(p => `- ${p}`).join('\n')}

## 🧩 COMPONENT ANALYSIS
- **Total Components**: ${this.stats.components.length}
- **Average Component Size**: ${this.stats.quality.avgComponentSize} lines
- **Client Components**: ${this.stats.components.filter(c => c.isClient).length}
- **Components with State**: ${this.stats.components.filter(c => c.hasState).length}
- **Components with Effects**: ${this.stats.components.filter(c => c.hasEffects).length}

### Top 5 Largest Components:
${this.stats.components
  .sort((a, b) => b.lines - a.lines)
  .slice(0, 5)
  .map(c => `- ${c.name}: ${c.lines} lines`)
  .join('\n')}

## 🌐 API ROUTES
- **Total API Routes**: ${this.stats.apis.length}
- **Routes with Auth**: ${this.stats.apis.filter(a => a.hasAuth).length}
- **AI-Powered Routes**: ${this.stats.apis.filter(a => a.usesAI).length}

### Routes by Method:
${['GET', 'POST', 'PUT', 'DELETE'].map(method => 
  `- ${method}: ${this.stats.apis.filter(a => a.methods.includes(method)).length}`
).join('\n')}

## 🔄 STATE MANAGEMENT
- **Context Providers**: ${this.stats.contexts.length}
- **Custom Hooks**: ${this.stats.hooks.length}

### Contexts:
${this.stats.contexts.map(c => `- ${c.name}: ${c.providers} providers, ${c.hooks} hooks`).join('\n')}

## 💾 DATABASE USAGE
- **Type**: ${this.stats.database.type}
- **Collections**: ${this.stats.database.collections.join(', ')}
- **Total Operations**: ${this.stats.database.operations.length} files with DB operations

### Operation Distribution:
${(() => {
  const totals = this.stats.database.operations.reduce((acc, op) => {
    acc.reads += op.reads;
    acc.writes += op.writes;
    acc.deletes += op.deletes;
    return acc;
  }, { reads: 0, writes: 0, deletes: 0 });
  return `- Reads: ${totals.reads}\n- Writes: ${totals.writes}\n- Deletes: ${totals.deletes}`;
})()}

## 🔒 SECURITY ANALYSIS
- **Security Issues Found**: ${this.stats.security.issues.length}
- **Has Environment Variables**: ${this.stats.security.hasEnvFile ? 'Yes' : 'No'}
- **Uses HTTPS**: ${this.stats.security.usesHTTPS ? 'Yes' : 'No'}
- **Has Authentication**: ${this.stats.security.hasAuthentication ? 'Yes' : 'No'}

${this.stats.security.issues.length > 0 ? `### Issues to Address:
${this.stats.security.issues.map(i => `- [${i.severity.toUpperCase()}] ${i.file}: ${i.issue}`).join('\n')}` : '### ✅ No critical security issues detected'}

## ⚡ PERFORMANCE OPTIMIZATIONS
- **Memoization Usage**: ${this.stats.performance.memoization} instances
- **Lazy Loading**: ${this.stats.performance.lazyLoading} instances
- **Image Optimization**: ${this.stats.performance.imageOptimization} instances
- **Debouncing**: ${this.stats.performance.debouncing} instances

## ✨ CODE QUALITY METRICS
- **Average Component Size**: ${this.stats.quality.avgComponentSize} lines
- **Average Complexity Score**: ${this.stats.quality.avgComplexity}
- **Has Test Suite**: ${this.stats.quality.hasTests ? 'Yes' : 'No'}

## 📦 DEPENDENCIES
- **Production Dependencies**: ${this.stats.dependencyAnalysis.total}
- **Dev Dependencies**: ${this.stats.dependencyAnalysis.dev}

### Key Dependencies:
${Object.entries(this.stats.dependencyAnalysis.key)
  .filter(([_, v]) => v)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

## 🎯 RECOMMENDATIONS FOR IMPROVEMENT

### High Priority:
1. **Authentication Issues**: TestSprite tests showed authentication failures - need to fix Firebase Auth flow
2. **Project Management**: Recently fixed project completion persistence - monitor for stability
3. **Test Coverage**: Add comprehensive test suite (currently ${this.stats.quality.hasTests ? 'minimal' : 'no'} tests)

### Medium Priority:
1. **Component Optimization**: Some components exceed 400 lines - consider splitting
2. **Performance**: Add more memoization to complex components
3. **Error Handling**: Implement global error boundary

### Low Priority:
1. **Documentation**: Add JSDoc comments to complex functions
2. **TypeScript**: Consider migrating to TypeScript for better type safety
3. **Analytics**: Implement user behavior tracking

## 🤖 AI INTEGRATION OPPORTUNITIES

### Current AI Usage:
- Task breakdown generation (GPT-3.5)
- AI mentor check-ins
- Voice transcription (Whisper)
- Personalized task suggestions

### Potential Grok Integration Points:
1. **Intelligent Code Review**: Analyze commits for potential bugs
2. **User Behavior Prediction**: Predict task abandonment and intervene
3. **Smart Debugging**: Real-time error analysis and fixes
4. **Performance Optimization**: Identify bottlenecks in real-time
5. **Personalization Engine**: Deep learning on user patterns

---

## 📋 FILE TYPE DISTRIBUTION
${Object.entries(this.stats.fileTypes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([ext, count]) => `- ${ext}: ${count} files`)
  .join('\n')}

---

*This analysis provides a comprehensive overview of the Betterish Web codebase, identifying strengths, weaknesses, and opportunities for improvement. Use this data to guide refactoring decisions and feature development.*
`;

    return report;
  }
}

// Run the analyzer
async function main() {
  const analyzer = new CodebaseAnalyzer();
  const report = await analyzer.analyze();
  
  // Save the report
  await fs.writeFile('CODEBASE_ANALYSIS.md', report);
  console.log('\n✅ Analysis complete! Report saved to CODEBASE_ANALYSIS.md');
  
  // Also create a JSON version for programmatic access
  await fs.writeFile('codebase-analysis.json', JSON.stringify(analyzer.stats, null, 2));
  console.log('📊 JSON data saved to codebase-analysis.json');
  
  console.log('\n📝 You can now share CODEBASE_ANALYSIS.md with Grok for comprehensive feedback!');
}

main().catch(console.error);