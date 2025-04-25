const fs = require('fs').promises;
const path = require('path');
// Load environment variables from .env file
require('dotenv').config();
const config = require('./config/default');
const GeneratorFactory = require('./generators');
const JsonProcessor = require('./parser/processor');
const HtmlRenderer = require('./display/renderer');

/**
 * Main application class for image generation
 */
class ImageGenApp {
  /**
   * Create a new application instance
   * @param {Object} config - Configuration settings
   * @param {Object} options - Runtime options
   */
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      // Default options
      dryRun: false,
      singleFile: null,
      imageLimit: Infinity,
      totalLimit: Infinity,
      // Override with provided options
      ...options
    };
    
    this.generatorFactory = GeneratorFactory;
    this.jsonProcessor = new JsonProcessor();
    this.htmlRenderer = new HtmlRenderer(config);
    this.generators = [];
    
    // Initialize generators based on config
    this._initGenerators();
    
    // Log run mode
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN MODE: No images will actually be generated');
    }
    
    // Log image limits if specified
    if (this.options.imageLimit < Infinity) {
      console.log(`🔢 Per-prompt limit: ${this.options.imageLimit} images per prompt`);
    }
    
    if (this.options.totalLimit < Infinity) {
      console.log(`📊 Total limit: ${this.options.totalLimit} images total`);
    }
    
    // Log single file mode if specified
    if (this.options.singleFile) {
      console.log(`📄 Processing single file: ${this.options.singleFile}`);
    }
  }

  /**
   * Initialize generators from configuration
   * @private
   */
  _initGenerators() {
    // Clear existing generators
    this.generators = [];
    
    // Create generators based on config
    const generatorTypes = this.config.generators || [];
    
    for (const type of generatorTypes) {
      try {
        let genConfig;
        
        // Get appropriate API config based on generator type
        if (type === 'dall-e') {
          genConfig = this.config.apis.openai;
          // Skip if no API key is provided for DALL-E
          if (!genConfig.apiKey) {
            console.log(`Skipping ${type} generator - no API key provided`);
            continue;
          }
        } else if (type === 'stable-diffusion') {
          genConfig = this.config.apis.stability;
          // Skip if no API key is provided for Stable Diffusion
          if (!genConfig.apiKey) {
            console.log(`Skipping ${type} generator - no API key provided`);
            continue;
          }
        } else if (type === 'gpt-image') {
          genConfig = this.config.apis['gpt-image'];
          // Use same API key as OpenAI since GPT Image uses the OpenAI API
          if (!this.config.apis.openai.apiKey) {
            console.log(`Skipping ${type} generator - no OpenAI API key provided`);
            continue;
          }
          // Set the API key explicitly from the OpenAI config
          genConfig.apiKey = this.config.apis.openai.apiKey;
        } else {
          // For other generator types, use empty config
          genConfig = {};
        }
        
        try {
          // Create and add generator
          const generator = this.generatorFactory.create(type, genConfig);
          this.generators.push(generator);
        } catch (error) {
          console.error(`Failed to initialize generator ${type}:`, error.message);
        }
      } catch (error) {
        console.error(`Failed to initialize generator ${type}:`, error.message);
      }
    }
    
    console.log(`Initialized ${this.generators.length} generators:`, 
      this.generators.length > 0 ? this.generators.map(g => g.name).join(', ') : 'none');
  }

  /**
   * Process a single JSON input file
   * @param {string} jsonPath - Path to the JSON file
   * @param {number} currentTotal - Current total of images generated
   * @returns {Promise<{results: Array, totalGenerated: number}>} - Generated results and new total
   */
  async processJsonFile(jsonPath, currentTotal = 0) {
    try {
      console.log(`Processing input file: ${jsonPath}`);
      
      // Read and parse JSON file
      const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
      
      // Extract prompts and metadata
      const promptItems = this.jsonProcessor.processJson(jsonData);
      console.log(`Extracted ${promptItems.length} prompts from ${jsonPath}`);
      
      // Generate images for each prompt using all generators
      const results = [];
      let totalGenerated = currentTotal;
      
      // Exit early if we've already hit the total limit
      if (totalGenerated >= this.options.totalLimit) {
        console.log(`Already reached total image limit (${this.options.totalLimit}), skipping file`);
        return { results, totalGenerated };
      }
      
      // Process prompts up to the limit
      const promptsToProcess = [];
      let countForLimit = currentTotal;
      
      // Prepare prompt-generator pairs to process, respecting limits
      for (const item of promptItems) {
        // Create a placeholder for dry run or apply image limit
        const generatorsToUse = this.options.imageLimit === 0 ? [] : 
          this.generators.slice(0, this.options.imageLimit);
        
        for (const generator of generatorsToUse) {
          // Check if we've reached the total limit
          if (countForLimit >= this.options.totalLimit) {
            console.log(`Would exceed total image limit (${this.options.totalLimit}), skipping remaining generators`);
            break;
          }
          
          // Add this prompt-generator pair to our processing queue
          promptsToProcess.push({ prompt: item, generator });
          countForLimit++;
        }
        
        // Break if we've reached the total limit
        if (countForLimit >= this.options.totalLimit) {
          console.log(`Would exceed total image limit (${this.options.totalLimit}), skipping remaining prompts`);
          break;
        }
      }
      
      console.log(`Processing ${promptsToProcess.length} prompt-generator combinations`);
      
      // Group prompts by generator type to avoid rate limiting issues
      const generatorGroups = {};
      
      for (const item of promptsToProcess) {
        const genName = item.generator.name;
        if (!generatorGroups[genName]) {
          generatorGroups[genName] = [];
        }
        generatorGroups[genName].push(item);
      }
      
      // Process each generator type with appropriate concurrency
      for (const [generatorName, items] of Object.entries(generatorGroups)) {
        console.log(`Processing ${items.length} prompts for ${generatorName}...`);
        
        // Set concurrency limits based on the generator type
        // OpenAI has stricter rate limits, so we process these more carefully
        const concurrencyLimit = generatorName.includes('dall-e') || generatorName.includes('gpt-image') ? 1 : 5;
        
        // Process in batches to respect rate limits
        for (let i = 0; i < items.length; i += concurrencyLimit) {
          const batch = items.slice(i, i + concurrencyLimit);
          
          // Process batch in parallel
          const batchPromises = batch.map(async ({ prompt, generator }) => {
            try {
              let result;
              
              if (this.options.dryRun) {
                // Create a placeholder result for dry run
                result = {
                  url: 'https://example.com/placeholder-dry-run.png',
                  prompt: prompt.prompt,
                  model: generator.model || 'unknown',
                  metadata: {
                    ...prompt.metadata,
                    timestamp: new Date().toISOString(),
                    generator: generator.name,
                    generatorVersion: generator.model || 'unknown',
                    dryRun: true,
                    runOptions: { ...this.options }
                  }
                };
                console.log(`[DRY RUN] Would generate image with ${generator.name}: "${prompt.prompt}"`);
              } else {
                // Actually generate the image
                result = await generator.generateImage(prompt.prompt, {
                  ...prompt.metadata,
                  runOptions: { ...this.options }
                });
                
                // Increment counter only if generation succeeded
                totalGenerated++;
                
                console.log(`Generated image ${totalGenerated}/${this.options.totalLimit !== Infinity ? this.options.totalLimit : '∞'} with ${generator.name}`);
              }
              
              // Add source information to the result
              result.source = prompt.source;
              
              return result;
            } catch (error) {
              console.error(`Error generating image with ${generator.name}:`, error.message);
              return null; // Return null for failed generations
            }
          });
          
          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);
          
          // Add successful results to the final results array
          batchResults.filter(result => result !== null).forEach(result => {
            results.push(result);
          });
          
          // Add a small delay between batches for API rate limiting
          if (i + concurrencyLimit < items.length && !this.options.dryRun && 
              (generatorName.includes('dall-e') || generatorName.includes('gpt-image'))) {
            console.log('Pausing briefly to avoid rate limits...');
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
      
      console.log(`${this.options.dryRun ? 'Would generate' : 'Generated'} ${results.length} images`);
      
      
      return { results, totalGenerated };
    } catch (error) {
      console.error(`Error processing ${jsonPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Process all JSON files in the input directory
   * @returns {Promise<Array>} - Array of all generation results
   */
  async processAllInputs() {
    try {
      const allResults = [];
      let totalGenerated = 0;
      
      // If single file mode is enabled, only process that file
      if (this.options.singleFile) {
        const singleFilePath = path.isAbsolute(this.options.singleFile) 
          ? this.options.singleFile 
          : path.join(process.cwd(), this.options.singleFile);
        
        if (!await this._fileExists(singleFilePath)) {
          throw new Error(`File not found: ${singleFilePath}`);
        }
        
        const { results, totalGenerated: newTotal } = await this.processJsonFile(singleFilePath, totalGenerated);
        return results;
      }
      
      // Process all files in input directory
      const inputDir = this.config.paths.input;
      
      // Get list of JSON files in input directory
      const files = await fs.readdir(inputDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      console.log(`Found ${jsonFiles.length} JSON files in ${inputDir}`);
      
      // Process each file
      for (const file of jsonFiles) {
        // Stop if we've reached the total limit
        if (totalGenerated >= this.options.totalLimit) {
          console.log(`Reached total limit of ${this.options.totalLimit} images, skipping remaining files`);
          break;
        }
        
        const filePath = path.join(inputDir, file);
        const { results, totalGenerated: newTotal } = await this.processJsonFile(filePath, totalGenerated);
        allResults.push(...results);
        totalGenerated = newTotal;
      }
      
      return allResults;
    } catch (error) {
      console.error('Error processing inputs:', error.message);
      throw error;
    }
  }

  /**
   * Check if a file exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} - Whether the file exists
   * @private
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run the complete generation process
   * @returns {Promise<string>} - Path to the generated HTML output
   */
  async run() {
    try {
      // Check if we have any valid generators
      if (this.generators.length === 0) {
        console.error('No valid generators available. Please check your API keys.');
        throw new Error('No valid generators available');
      }
      
      // Create output directory if it doesn't exist
      await fs.mkdir(this.config.paths.output, { recursive: true });
      
      // Process all inputs
      const results = await this.processAllInputs();
      console.log(`${this.options.dryRun ? 'Would generate' : 'Generated'} ${results.length} images`);
      
      // Generate output filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFilename = this.options.singleFile 
        ? `${path.basename(this.options.singleFile, '.json')}-${timestamp}.html`
        : `generated-${timestamp}.html`;
      
      const outputPath = path.join(
        this.config.paths.output,
        outputFilename
      );
      
      // Render HTML output
      await this.htmlRenderer.renderBatch(results, outputPath);
      console.log(`Generated HTML output: ${outputPath}`);
      
      // Try to open the file in the browser
      try {
        console.log(`Opening ${outputPath} in your browser...`);
        const open = await import('open');
        await open.default(outputPath);
      } catch (error) {
        console.log(`Please manually open the file: ${outputPath}`);
      }
      
      return outputPath;
    } catch (error) {
      console.error('Error running image generation:', error.message);
      throw error;
    }
  }
}

// Export the main class
module.exports = ImageGenApp;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    singleFile: null,
    imageLimit: Infinity,
    totalLimit: Infinity
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
        
      case '--file':
      case '-f':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options.singleFile = args[i + 1];
          i++; // Skip the next argument
        } else {
          console.error('Error: --file requires a file path');
          process.exit(1);
        }
        break;
        
      case '--limit':
      case '-l':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          const limit = parseInt(args[i + 1], 10);
          if (isNaN(limit) || limit < 0) {
            console.error('Error: --limit requires a positive number');
            process.exit(1);
          }
          options.imageLimit = limit;
          i++; // Skip the next argument
        } else {
          console.error('Error: --limit requires a number');
          process.exit(1);
        }
        break;
        
      case '--total':
      case '-t':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          const limit = parseInt(args[i + 1], 10);
          if (isNaN(limit) || limit < 0) {
            console.error('Error: --total requires a positive number');
            process.exit(1);
          }
          options.totalLimit = limit;
          i++; // Skip the next argument
        } else {
          console.error('Error: --total requires a number');
          process.exit(1);
        }
        break;
        
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
        
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        } else if (!options.singleFile) {
          // Assume it's a file if no file specified yet and it doesn't start with -
          options.singleFile = arg;
        }
    }
  }
  
  return options;
}

// Show help message
function showHelp() {
  console.log(`
Image Generation Tool - Usage:
  node src/index.js [options] [file]

Options:
  -d, --dry-run        Dry run mode (don't actually generate images)
  -f, --file FILE      Process a specific JSON file
  -l, --limit NUM      Limit the number of images generated per prompt
  -t, --total NUM      Limit the total number of images generated
  -h, --help           Show this help message

Examples:
  node src/index.js                         # Process all files in input directory
  node src/index.js --dry-run               # Dry run with all files
  node src/index.js input/example.json      # Process a single file
  node src/index.js -f input/example.json   # Process a single file
  node src/index.js -l 2                    # Limit to 2 images per prompt
  node src/index.js -t 3                    # Generate only 3 images total
  node src/index.js -f example.json -t 5    # Process a file, stopping after 5 images
  node src/index.js -f example.json -l 1 -d # Dry run a single file with 1 image per prompt
  `);
}

// Run the app if this file is executed directly
if (require.main === module) {
  const options = parseArgs();
  const app = new ImageGenApp(config, options);
  
  app.run()
    .then(outputPath => {
      console.log(`Generation complete. Output: ${outputPath}`);
    })
    .catch(error => {
      console.error('Application failed:', error.message);
      process.exit(1);
    });
}
