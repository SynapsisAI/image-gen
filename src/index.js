const fs = require('fs').promises;
const path = require('path');
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
   */
  constructor(config) {
    this.config = config;
    this.generatorFactory = GeneratorFactory;
    this.jsonProcessor = new JsonProcessor();
    this.htmlRenderer = new HtmlRenderer(config);
    this.generators = [];
    
    // Initialize generators based on config
    this._initGenerators();
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
        } else if (type === 'stable-diffusion') {
          genConfig = this.config.apis.stability;
        } else {
          // For other generator types, use empty config
          genConfig = {};
        }
        
        // Create and add generator
        const generator = this.generatorFactory.create(type, genConfig);
        this.generators.push(generator);
      } catch (error) {
        console.error(`Failed to initialize generator ${type}:`, error.message);
      }
    }
    
    console.log(`Initialized ${this.generators.length} generators:`, 
      this.generators.map(g => g.name).join(', '));
  }

  /**
   * Process a single JSON input file
   * @param {string} jsonPath - Path to the JSON file
   * @returns {Promise<Array>} - Array of generation results
   */
  async processJsonFile(jsonPath) {
    try {
      console.log(`Processing input file: ${jsonPath}`);
      
      // Read and parse JSON file
      const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
      
      // Extract prompts and metadata
      const promptItems = this.jsonProcessor.processJson(jsonData);
      console.log(`Extracted ${promptItems.length} prompts from ${jsonPath}`);
      
      // Generate images for each prompt using all generators
      const results = [];
      
      for (const item of promptItems) {
        for (const generator of this.generators) {
          try {
            const result = await generator.generateImage(item.prompt, item.metadata);
            
            // Add source information to the result
            result.source = item.source;
            
            results.push(result);
          } catch (error) {
            console.error(`Error generating image with ${generator.name}:`, error.message);
          }
        }
      }
      
      return results;
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
      const inputDir = this.config.paths.input;
      
      // Get list of JSON files in input directory
      const files = await fs.readdir(inputDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      console.log(`Found ${jsonFiles.length} JSON files in ${inputDir}`);
      
      // Process each file
      const allResults = [];
      
      for (const file of jsonFiles) {
        const filePath = path.join(inputDir, file);
        const results = await this.processJsonFile(filePath);
        allResults.push(...results);
      }
      
      return allResults;
    } catch (error) {
      console.error('Error processing inputs:', error.message);
      throw error;
    }
  }

  /**
   * Run the complete generation process
   * @returns {Promise<string>} - Path to the generated HTML output
   */
  async run() {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(this.config.paths.output, { recursive: true });
      
      // Process all inputs
      const results = await this.processAllInputs();
      console.log(`Generated ${results.length} images`);
      
      // Render HTML output
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(
        this.config.paths.output,
        `generated-${timestamp}.html`
      );
      
      await this.htmlRenderer.renderBatch(results, outputPath);
      console.log(`Generated HTML output: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error('Error running image generation:', error.message);
      throw error;
    }
  }
}

// Export the main class
module.exports = ImageGenApp;

// Run the app if this file is executed directly
if (require.main === module) {
  const app = new ImageGenApp(config);
  app.run()
    .then(outputPath => {
      console.log(`Generation complete. Output: ${outputPath}`);
    })
    .catch(error => {
      console.error('Application failed:', error.message);
      process.exit(1);
    });
}
