const ImageGenerator = require('./base');
const fs = require('fs');
const path = require('path');

/**
 * GPT Image generator implementation using OpenAI API
 */
class GptImageGenerator extends ImageGenerator {
  /**
   * Create a new GPT Image generator
   * @param {Object} config - Configuration with apiKey and additional settings
   */
  constructor(config = {}) {
    super(config);
    this.name = 'gpt-image';
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-image-1';
    this.size = config.size || '1024x1024';
    this.quality = config.quality || 'standard';
    this.background = config.background || 'auto';
    this.format = config.format || 'png';
    
    // More detailed error message for missing or empty API key
    if (!this.apiKey) {
      console.error('OpenAI API key is missing or empty!');
      console.error('Please add OPENAI_API_KEY to your .env file');
      console.error('Make sure the .env file exists in the project root directory');
      throw new Error('OpenAI API key is required for GPT Image generator');
    }
    
    // Log key length for debugging (not the actual key)
    console.log(`GPT Image initialized with API key (${this.apiKey.length} characters)`);
  }

  /**
   * Generate an image using GPT Image
   * @param {string} prompt - The image generation prompt
   * @param {Object} metadata - Additional metadata for the image
   * @returns {Promise<Object>} - The generated image data
   */
  async generateImage(prompt, metadata = {}) {
    try {
      console.log(`Generating image with ${this.model}: ${prompt}`);
      
      // Call OpenAI API for GPT Image generation
      const response = await this._callGptImageAPI(prompt);
      
      return {
        url: response.url,
        prompt,
        model: this.model,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          generator: this.name,
          generatorVersion: this.model,
          size: this.size,
          quality: this.quality,
          background: this.background,
          format: this.format
        }
      };
    } catch (error) {
      console.error('GPT Image generation error:', error);
      
      // Return a placeholder image instead of failing completely
      console.log('Using placeholder image due to API error');
      return {
        url: './placeholder.svg',
        prompt,
        model: this.model,
        error: error.message,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          generator: this.name,
          generatorVersion: this.model,
          size: this.size,
          quality: this.quality,
          background: this.background,
          format: this.format,
          error: error.message,
          isPlaceholder: true
        }
      };
    }
  }

  /**
   * Private method to call OpenAI API for GPT Image generation
   * @param {string} prompt - The image prompt
   * @returns {Promise<Object>} - The API response
   */
  async _callGptImageAPI(prompt) {
    try {
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'output', 'images');
      await fs.promises.mkdir(outputDir, { recursive: true });
      
      // Using the OpenAI client library
      const OpenAI = require('openai');
      
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: this.apiKey
      });
      
      console.log(`Calling OpenAI API for ${this.model} with prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
      
      // Prepare request parameters
      const requestParams = {
        model: this.model,
        prompt: prompt,
        n: 1,
        size: this.size,
        quality: this.quality,
        response_format: 'b64_json'
      };
      
      // Add conditional parameters if they're non-default
      if (this.background !== 'auto') {
        requestParams.background = this.background;
      }
      
      // Make API call to generate image
      const response = await openai.images.generate(requestParams);
      
      console.log(`OpenAI API response received for ${this.model} image generation`);
      
      // Get base64 image data
      const imageBase64 = response.data[0].b64_json;
      const buffer = Buffer.from(imageBase64, 'base64');
      
      // Save the image to disk
      const timestamp = Date.now();
      const filename = `gpt-image-${timestamp}.${this.format}`;
      const filePath = path.join(outputDir, filename);
      
      await fs.promises.writeFile(filePath, buffer);
      console.log(`Saved generated image to ${filePath}`);
      
      // Return a local path to the image
      const relativePath = path.join('images', filename);
      
      return {
        url: relativePath,
        created: timestamp
      };
    } catch (error) {
      console.error(`Error calling OpenAI API for ${this.model}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get GPT Image capabilities
   * @returns {Object} - Object describing capabilities
   */
  getCapabilities() {
    return {
      name: this.name,
      supportsNegativePrompts: false,
      maxPromptLength: 4000,
      supportedSizes: ['1024x1024', '1536x1024', '1024x1536'],
      supportedFormats: ['png', 'jpeg', 'webp'],
      modelVersion: this.model,
      supportedQualities: ['low', 'medium', 'high', 'auto'],
      supportedBackgrounds: ['auto', 'transparent'],
      transparentBackgroundFormats: ['png', 'webp']
    };
  }
}

module.exports = GptImageGenerator;