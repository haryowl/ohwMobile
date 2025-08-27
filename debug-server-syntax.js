#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging server.js syntax...');

// Read the generated server.js file
const serverPath = path.join(process.env.HOME || process.env.USERPROFILE, 'ohwMobile', 'server.js');

if (!fs.existsSync(serverPath)) {
    console.log('❌ server.js not found at:', serverPath);
    process.exit(1);
}

console.log('📁 Found server.js at:', serverPath);

// Read the file content
const content = fs.readFileSync(serverPath, 'utf8');
console.log('📊 File size:', content.length, 'characters');

// Check for common syntax issues
const issues = [];

// Check for unmatched braces
let braceCount = 0;
let bracketCount = 0;
let parenCount = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    switch (char) {
        case '{': braceCount++; break;
        case '}': braceCount--; break;
        case '[': bracketCount++; break;
        case ']': bracketCount--; break;
        case '(': parenCount++; break;
        case ')': parenCount--; break;
    }
}

if (braceCount !== 0) issues.push(`Unmatched braces: ${braceCount}`);
if (bracketCount !== 0) issues.push(`Unmatched brackets: ${bracketCount}`);
if (parenCount !== 0) issues.push(`Unmatched parentheses: ${parenCount}`);

// Check for common syntax patterns that might cause issues
const patterns = [
    { pattern: /if\s*\([^)]*\)\s*\{[^}]*$/, name: 'Unclosed if block' },
    { pattern: /function\s*\([^)]*\)\s*\{[^}]*$/, name: 'Unclosed function' },
    { pattern: /const\s+\w+\s*=\s*[^;]*$/, name: 'Unterminated const declaration' },
    { pattern: /let\s+\w+\s*=\s*[^;]*$/, name: 'Unterminated let declaration' },
    { pattern: /var\s+\w+\s*=\s*[^;]*$/, name: 'Unterminated var declaration' }
];

patterns.forEach(({ pattern, name }) => {
    if (pattern.test(content)) {
        issues.push(name);
    }
});

// Try to parse the JavaScript
try {
    require('vm').runInNewContext(content, {}, { timeout: 5000 });
    console.log('✅ JavaScript syntax appears valid');
} catch (error) {
    console.log('❌ JavaScript syntax error:', error.message);
    issues.push(`Syntax error: ${error.message}`);
}

// Show line-by-line analysis for the first 100 lines
console.log('\n📋 First 100 lines analysis:');
const lines = content.split('\n').slice(0, 100);
lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (line.trim() && (line.includes('if') || line.includes('function') || line.includes('const') || line.includes('let'))) {
        console.log(`Line ${lineNum}: ${line.trim()}`);
    }
});

if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
} else {
    console.log('\n✅ No obvious syntax issues found');
}

console.log('\n🔍 Checking for specific problematic patterns...');

// Look for the specific area where we had issues
const tcpSection = content.indexOf('// TCP Server for GalileoSky devices');
const udpSection = content.indexOf('// UDP Server for GalileoSky devices');

if (tcpSection !== -1) {
    console.log('📍 TCP section found at position:', tcpSection);
    const tcpCode = content.substring(tcpSection, tcpSection + 1000);
    console.log('📝 TCP section preview:');
    console.log(tcpCode.split('\n').slice(0, 20).join('\n'));
}

if (udpSection !== -1) {
    console.log('📍 UDP section found at position:', udpSection);
    const udpCode = content.substring(udpSection, udpSection + 1000);
    console.log('📝 UDP section preview:');
    console.log(udpCode.split('\n').slice(0, 20).join('\n'));
}
