const ImageGenerator = require('./base');

/**
 * DALL-E image generator implementation using OpenAI API
 */
class DalleGenerator extends ImageGenerator {
  /**
   * Create a new DALL-E generator
   * @param {Object} config - Configuration with apiKey and model version
   */
  constructor(config = {}) {
    super(config);
    this.name = 'dall-e';
    this.apiKey = config.apiKey;
    this.model = config.model || 'dall-e-3';
    this.size = config.size || '1024x1024';
    
    // More detailed error message for missing or empty API key
    if (!this.apiKey) {
      console.error('OpenAI API key is missing or empty!');
      console.error('Please add OPENAI_API_KEY to your .env file');
      console.error('Make sure the .env file exists in the project root directory');
      throw new Error('OpenAI API key is required for DALL-E generator');
    }
    
    // Log key length for debugging (not the actual key)
    console.log(`DALL-E initialized with API key (${this.apiKey.length} characters)`);
  }

  /**
   * Generate an image using DALL-E
   * @param {string} prompt - The image generation prompt
   * @param {Object} metadata - Additional metadata for the image
   * @returns {Promise<Object>} - The generated image data
   */
  async generateImage(prompt, metadata = {}) {
    try {
      console.log(`Generating image with DALL-E (${this.model}): ${prompt}`);
      
      // Call OpenAI API
      const response = await this._callOpenAIAPI(prompt);
      
      return {
        url: response.url,
        prompt,
        model: this.model,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          generator: this.name,
          generatorVersion: this.model
        }
      };
    } catch (error) {
      console.error('DALL-E generation error:', error);
      
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
          error: error.message,
          isPlaceholder: true
        }
      };
    }
  }

  /**
   * Private method to call OpenAI API
   * @param {string} prompt - The image prompt
   * @returns {Promise<Object>} - The API response
   */
  async _callOpenAIAPI(prompt) {
    try {
      // Using the OpenAI client library
      const OpenAI = require('openai');
      
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: this.apiKey
      });
      
      console.log(`Calling OpenAI API for DALL-E with prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
      
      // Make API call to generate image
      const response = await openai.images.generate({
        model: this.model,
        prompt: prompt,
        n: 1,
        size: this.size,
        response_format: 'url'
      });
      
      console.log('OpenAI API response received');
      
      // Return the image URL from the response
      return {
        url: response.data[0].url,
        created: Date.now()
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get DALL-E capabilities
   * @returns {Object} - Object describing capabilities
   */
  getCapabilities() {
    const capabilities = {
      name: this.name,
      supportsNegativePrompts: false,
      supportedSizes: ['1024x1024', '1024x1792', '1792x1024'],
      supportedFormats: ['png'],
      modelVersion: this.model
    };
    
    // DALL-E 3 has longer prompt support than DALL-E 2
    if (this.model === 'dall-e-3') {
      capabilities.maxPromptLength = 4000;
    } else {
      capabilities.maxPromptLength = 1000;
    }
    
    return capabilities;
  }
}

module.exports = DalleGenerator;
