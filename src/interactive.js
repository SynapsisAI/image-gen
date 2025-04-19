/**
 * Interactive mode script for image generation
 */
const fs = require('fs').promises;
const path = require('path');
// Load environment variables
require('dotenv').config();

const config = require('./config/default');
const ImageGenApp = require('./index');
const menu = require('./menu');

/**
 * Run interactive menu and start generation
 */
async function runInteractive() {
  // Handle clean exit on Ctrl+C
  process.on('SIGINT', () => {
    console.log('\nProcess interrupted. Exiting...');
    process.exit(0);
  });
  
  try {
    console.log('\n=== Image Generation Interactive Mode ===\n');
    
    // Select input files
    const selectedFiles = await menu.selectInputFiles(config.paths.input);
    
    if (selectedFiles.length === 0) {
      console.log('No files selected. Exiting...');
      process.exit(0);
    }
    
    // Set generation options
    const options = await menu.setGenerationOptions();
    
    // Confirm generation
    console.log('\nReady to start generation process.');
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    try {
      await new Promise(resolve => {
        rl.question('Press Enter to continue or Ctrl+C to cancel... ', answer => {
          resolve(answer);
        });
      });
    } finally {
      rl.close();
    }
    
    console.log('\nStarting generation process...');
    
    // Run generation for each selected file
    const results = [];
    
    for (const filePath of selectedFiles) {
      try {
        // Create app instance with options and file
        const fileOptions = {
          ...options,
          singleFile: filePath
        };
        
        const app = new ImageGenApp(config, fileOptions);
        
        // Skip processing if no valid generators are available
        if (app.generators.length === 0) {
          console.log('\n⚠️ Warning: No valid generators available. Please check your API keys.');
          console.log('Skipping file processing...');
          continue;
        }
        
        console.log(`\nProcessing file: ${path.basename(filePath)}`);
        
        // Run the app
        const outputPath = await app.run();
        results.push(outputPath);
      } catch (fileError) {
        console.error(`Error processing file ${path.basename(filePath)}:`, fileError.message);
        console.log('Continuing with next file...');
      }
    }
    
    if (results.length > 0) {
      console.log('\n=== Generation Complete ===');
      console.log('Generated outputs:');
      results.forEach(result => console.log(`- ${result}`));
    } else {
      console.log('\n=== No outputs were generated successfully ===');
    }
    
  } catch (error) {
    console.error('Interactive mode error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runInteractive();
}

module.exports = { runInteractive };