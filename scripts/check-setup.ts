/**
 * Check Extension Readiness
 * Verifies everything is set up correctly before data collection
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('\n🔍 Checking TripAdvisor Extension Setup\n');
console.log('='.repeat(60) + '\n');

let allGood = true;

// Check 1: Extension files
console.log('📦 Extension Files:');
const extensionPath = path.join(process.cwd(), 'browser-extension');
const requiredFiles = [
  'manifest.json',
  'content.js',
  'popup.html',
  'popup.js',
  'README.md'
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(extensionPath, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
}

// Check 2: Icons
console.log('\n🎨 Extension Icons:');
const iconSizes = ['16', '48', '128'];
let hasAllIcons = true;

for (const size of iconSizes) {
  const svgExists = fs.existsSync(path.join(extensionPath, `icon${size}.svg`));
  const pngExists = fs.existsSync(path.join(extensionPath, `icon${size}.png`));
  
  if (pngExists) {
    console.log(`   ✅ icon${size}.png (ready)`);
  } else if (svgExists) {
    console.log(`   ⚠️  icon${size}.svg (needs conversion to PNG)`);
    hasAllIcons = false;
  } else {
    console.log(`   ❌ icon${size} (missing)`);
    hasAllIcons = false;
    allGood = false;
  }
}

if (!hasAllIcons) {
  console.log('\n   💡 Convert SVG to PNG: https://cloudconvert.com/svg-to-png');
}

// Check 3: User list
console.log('\n👥 User List:');
const userListPath = path.join(process.cwd(), 'scripts', 'milan-users.txt');
if (fs.existsSync(userListPath)) {
  const content = fs.readFileSync(userListPath, 'utf-8');
  const urls = content.split('\n').filter(line => 
    line.trim() && !line.startsWith('#')
  );
  console.log(`   ✅ milan-users.txt (${urls.length} URLs)`);
  
  if (urls.length === 0) {
    console.log('   ⚠️  No URLs found in file');
    allGood = false;
  }
} else {
  console.log(`   ❌ milan-users.txt not found`);
  allGood = false;
}

// Check 4: Output directory
console.log('\n📁 Output Directory:');
const outputPath = path.join(os.homedir(), 'Downloads', 'tripadvisor-reviews');
const outputExists = fs.existsSync(outputPath);

if (outputExists) {
  const files = fs.readdirSync(outputPath).filter(f => f.endsWith('.json'));
  console.log(`   ✅ ${outputPath}`);
  console.log(`   📄 ${files.length} JSON files already collected`);
} else {
  console.log(`   ⚠️  Will be created when you extract first review`);
  console.log(`   📍 ${outputPath}`);
}

// Check 5: Environment
console.log('\n🔐 Environment:');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasServiceRole = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL`);
  console.log(`   ${hasServiceRole ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY`);
  
  if (!hasSupabaseUrl || !hasServiceRole) allGood = false;
} else {
  console.log(`   ❌ .env.local not found`);
  allGood = false;
}

// Check 6: Import script
console.log('\n📥 Import Script:');
const importScriptPath = path.join(process.cwd(), 'scripts', 'import-json-reviews.ts');
if (fs.existsSync(importScriptPath)) {
  console.log(`   ✅ import-json-reviews.ts`);
} else {
  console.log(`   ❌ import-json-reviews.ts not found`);
  allGood = false;
}

// Final status
console.log('\n' + '='.repeat(60) + '\n');

if (allGood && hasAllIcons) {
  console.log('✅ ALL CHECKS PASSED - Ready to go!\n');
  console.log('Next steps:');
  console.log('1. Load extension in Chrome (chrome://extensions/)');
  console.log('2. Visit first URL from milan-users.txt');
  console.log('3. Click extension → Extract Reviews');
  console.log('4. Repeat for all 122 users\n');
} else if (allGood && !hasAllIcons) {
  console.log('⚠️  ALMOST READY - Need PNG icons\n');
  console.log('Convert SVG to PNG:');
  console.log('• Go to: https://cloudconvert.com/svg-to-png');
  console.log('• Upload: icon16.svg, icon48.svg, icon128.svg');
  console.log('• Download as PNG');
  console.log('• Save in browser-extension/ folder\n');
  console.log('Then load extension in Chrome!\n');
} else {
  console.log('❌ SETUP INCOMPLETE - Fix errors above\n');
  console.log('See QUICK_START.md for detailed instructions\n');
}

console.log('📚 Documentation:');
console.log('• browser-extension/README.md - Extension guide');
console.log('• QUICK_START.md - Quick reference');
console.log('• scripts/milan-users.txt - Your 122 URLs\n');
