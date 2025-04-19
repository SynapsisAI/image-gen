// Script to set up the .env file
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.resolve(process.cwd(), '.env');

// Check if .env already exists
const fileExists = fs.existsSync(envPath);

console.log('\n=== Environment Setup ===\n');

if (fileExists) {
  console.log(`A .env file already exists at: ${envPath}`);
  rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      promptForKeys();
    } else {
      console.log('Setup canceled. Existing .env file was not modified.');
      rl.close();
    }
  });
} else {
  promptForKeys();
}

function promptForKeys() {
  rl.question('Enter your OpenAI API key: ', (openaiKey) => {
    rl.question('Enter your Stability API key (optional, press Enter to skip): ', (stabilityKey) => {
      writeEnvFile(openaiKey, stabilityKey);
      rl.close();
    });
  });
}

function writeEnvFile(openaiKey, stabilityKey) {
  let content = `# API Keys for image generation\n\n`;
  
  // Add OpenAI key
  content += `# OpenAI API key for DALL-E integration\n`;
  content += `OPENAI_API_KEY=${openaiKey}\n\n`;
  
  // Add Stability key if provided
  content += `# Stability AI API key for Stable Diffusion integration\n`;
  if (stabilityKey) {
    content += `STABILITY_API_KEY=${stabilityKey}\n\n`;
  } else {
    content += `# STABILITY_API_KEY=your_key_here\n\n`;
  }
  
  // Add optional configuration
  content += `# Optional: Override default configuration\n`;
  content += `# OUTPUT_DIR=./custom_output\n`;
  content += `# MODEL=dall-e-3\n`;
  
  // Write the file
  fs.writeFileSync(envPath, content);
  
  console.log(`\n✅ .env file created successfully at: ${envPath}`);
  console.log('You can now run the application with:');
  console.log('  npm start');
  console.log('\nOr check your environment with:');
  console.log('  npm run check-env');
}