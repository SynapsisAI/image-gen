// Script to check environment variables
require('dotenv').config();

console.log('\n=== Environment Check ===\n');

// Check OpenAI API Key
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.log('❌ OPENAI_API_KEY is missing or empty');
  console.log('   Please add it to your .env file');
} else {
  console.log(`✅ OPENAI_API_KEY is set (${openaiKey.length} characters)`);
  console.log(`   First 4 chars: ${openaiKey.substring(0, 4)}...`);
}

// Check Stability API Key
const stabilityKey = process.env.STABILITY_API_KEY;
if (!stabilityKey) {
  console.log('❔ STABILITY_API_KEY is not set (required for Stable Diffusion)');
  console.log('   To use Stable Diffusion, add it to your .env file');
} else {
  console.log(`✅ STABILITY_API_KEY is set (${stabilityKey.length} characters)`);
  console.log(`   First 4 chars: ${stabilityKey.substring(0, 4)}...`);
}

// Check .env file location
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');

try {
  const stat = fs.statSync(envPath);
  console.log(`✅ .env file exists at: ${envPath}`);
  console.log(`   File size: ${stat.size} bytes`);
} catch (err) {
  console.log(`❌ .env file not found at: ${envPath}`);
}

// Check dotenv package
try {
  const dotenvPkg = require('dotenv/package.json');
  console.log(`✅ dotenv package is installed (v${dotenvPkg.version})`);
} catch (err) {
  console.log('❌ dotenv package is not installed');
  console.log('   Run: npm install dotenv');
}

console.log('\n=== End of Environment Check ===\n');