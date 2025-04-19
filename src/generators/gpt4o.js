const ImageGenerator = require('./base');
const fs = require('fs');
const path = require('path');

/**
 * GPT-4o image generator implementation using OpenAI API
 */
class GPT4oGenerator extends ImageGenerator {
  /**
   * Create a new GPT-4o generator
   * @param {Object} config - Configuration with apiKey and additional settings
   */
  constructor(config = {}) {
    super(config);
    this.name = 'gpt4o';
    this.apiKey = config.apiKey;
    this.model = 'gpt-4o';
    this.size = config.size || '1024x1024';
    this.style = config.style || 'natural';
    this.quality = config.quality || 'standard';
    
    // More detailed error message for missing or empty API key
    if (!this.apiKey) {
      console.error('OpenAI API key is missing or empty!');
      console.error('Please add OPENAI_API_KEY to your .env file');
      console.error('Make sure the .env file exists in the project root directory');
      throw new Error('OpenAI API key is required for GPT-4o generator');
    }
    
    // Log key length for debugging (not the actual key)
    console.log(`GPT-4o initialized with API key (${this.apiKey.length} characters)`);
  }

  /**
   * Generate an image using GPT-4o
   * @param {string} prompt - The image generation prompt
   * @param {Object} metadata - Additional metadata for the image
   * @returns {Promise<Object>} - The generated image data
   */
  async generateImage(prompt, metadata = {}) {
    try {
      console.log(`Generating image with GPT-4o: ${prompt}`);
      
      // Call OpenAI API for GPT-4o image generation
      const response = await this._callGPT4oAPI(prompt);
      
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
          style: this.style,
          quality: this.quality
        }
      };
    } catch (error) {
      console.error('GPT-4o generation error:', error);
      
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
          style: this.style,
          quality: this.quality,
          error: error.message,
          isPlaceholder: true
        }
      };
    }
  }

  /**
   * Private method to call OpenAI API for GPT-4o image generation
   * @param {string} prompt - The image prompt
   * @returns {Promise<Object>} - The API response
   */
  async _callGPT4oAPI(prompt) {
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
      
      console.log(`Calling OpenAI API for GPT-4o with prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
      
      // Make API call to generate image
      const response = await openai.images.generate({
        model: this.model,
        prompt: prompt,
        n: 1,
        size: this.size,
        style: this.style,
        quality: this.quality,
        response_format: 'url'
      });
      
      console.log('OpenAI API response received for GPT-4o image generation');
      
      // Get the image URL from the response
      const imageUrl = response.data[0].url;
      
      // For most API responses, we'd need to download the image
      // as the URLs from OpenAI are temporary
      const fetch = require('node-fetch');
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.buffer();
      
      // Save the image to disk
      const timestamp = Date.now();
      const filename = `gpt4o-${timestamp}.png`;
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
      console.error('Error calling OpenAI API for GPT-4o:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get GPT-4o capabilities
   * @returns {Object} - Object describing capabilities
   */
  getCapabilities() {
    return {
      name: this.name,
      supportsNegativePrompts: false,
      maxPromptLength: 4000,
      supportedSizes: ['256x256', '512x512', '1024x1024', '2048x2048', '4096x4096'],
      supportedFormats: ['png'],
      modelVersion: this.model,
      supportedStyles: [
        'vivid', 'natural', 'anime', 'cinematic', 'digital-art', 
        'painterly', 'pixel-art', 'photographic'
      ],
      supportedQuality: ['standard', 'hd']
    };
  }
}

module.exports = GPT4oGenerator;