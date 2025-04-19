/**
 * Interactive menu for file selection before image generation
 */
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

/**
 * Display a menu of available input files and get user selection
 * @param {string} inputDir - Directory containing input files
 * @returns {Promise<string[]>} - Array of selected file paths
 */
async function selectInputFiles(inputDir) {
  try {
    // Get list of JSON files in input directory
    const files = await fs.readdir(inputDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('No JSON files found in the input directory.');
      return [];
    }
    
    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Display available files
    console.log('\n=== Available Input Files ===\n');
    
    jsonFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    console.log('\n0. All files');
    console.log('q. Quit');
    
    // Get user selection
    const answer = await new Promise(resolve => {
      rl.question('\nEnter your choice (number or comma-separated numbers): ', resolve);
    });
    
    rl.close();
    
    // Handle quit option
    if (answer.toLowerCase() === 'q') {
      console.log('Exiting...');
      process.exit(0);
    }
    
    // Handle "all files" option
    if (answer === '0') {
      console.log(`Selected all ${jsonFiles.length} files.`);
      return jsonFiles.map(file => path.join(inputDir, file));
    }
    
    // Handle selection of specific files
    const selections = answer.split(',').map(s => s.trim());
    const selectedFiles = [];
    
    for (const selection of selections) {
      const index = parseInt(selection, 10) - 1;
      
      if (isNaN(index) || index < 0 || index >= jsonFiles.length) {
        console.log(`Warning: Invalid selection "${selection}" - skipping.`);
        continue;
      }
      
      selectedFiles.push(path.join(inputDir, jsonFiles[index]));
    }
    
    if (selectedFiles.length === 0) {
      console.log('No valid files selected.');
      return [];
    }
    
    console.log(`Selected ${selectedFiles.length} file(s):`);
    selectedFiles.forEach(file => console.log(`- ${path.basename(file)}`));
    
    return selectedFiles;
  } catch (error) {
    console.error('Error selecting input files:', error.message);
    return [];
  }
}

/**
 * Let the user set generation options interactively
 * @returns {Promise<Object>} - Generation options
 */
async function setGenerationOptions() {
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Default options
  const options = {
    dryRun: false,
    imageLimit: Infinity,
    totalLimit: Infinity
  };
  
  // Ask about dry run mode
  options.dryRun = await new Promise(resolve => {
    rl.question('\nRun in dry run mode? (y/N): ', answer => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
  
  // Ask about per-prompt limit
  const promptLimitAnswer = await new Promise(resolve => {
    rl.question('\nLimit images per prompt? (Enter a number or press Enter for no limit): ', resolve);
  });
  
  if (promptLimitAnswer.trim() !== '') {
    const limit = parseInt(promptLimitAnswer, 10);
    if (!isNaN(limit) && limit >= 0) {
      options.imageLimit = limit;
    }
  }
  
  // Ask about total limit
  const totalLimitAnswer = await new Promise(resolve => {
    rl.question('\nLimit total images generated? (Enter a number or press Enter for no limit): ', resolve);
  });
  
  if (totalLimitAnswer.trim() !== '') {
    const limit = parseInt(totalLimitAnswer, 10);
    if (!isNaN(limit) && limit >= 0) {
      options.totalLimit = limit;
    }
  }
  
  rl.close();
  
  // Display selected options
  console.log('\n=== Generation Options ===');
  console.log(`- Dry Run Mode: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log(`- Images Per Prompt: ${options.imageLimit < Infinity ? options.imageLimit : 'No limit'}`);
  console.log(`- Total Images: ${options.totalLimit < Infinity ? options.totalLimit : 'No limit'}`);
  
  return options;
}

module.exports = {
  selectInputFiles,
  setGenerationOptions
};