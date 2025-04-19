const ImageGenerator = require('./base');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * Stable Diffusion image generator implementation using Stability AI API
 */
class StableDiffusionGenerator extends ImageGenerator {
  /**
   * Create a new Stable Diffusion generator
   * @param {Object} config - Configuration settings
   */
  constructor(config = {}) {
    super(config);
    this.name = 'stable-diffusion';
    this.apiKey = config.apiKey;
    this.model = config.model || 'stable-diffusion-xl-1024-v1-0';
    this.steps = config.steps || 30;
    this.cfgScale = config.cfgScale || 7;
    this.apiBaseUrl = 'https://api.stability.ai';
    
    if (!this.apiKey) {
      throw new Error('Stability AI API key is required for Stable Diffusion generator');
    }
    
    // Log key length for debugging (not the actual key)
    console.log(`Stable Diffusion initialized with API key (${this.apiKey.length} characters)`);
  }

  /**
   * Generate an image using Stable Diffusion
   * @param {string} prompt - The image generation prompt
   * @param {Object} metadata - Additional metadata for the image
   * @param {string} [negativePrompt] - Optional negative prompt
   * @returns {Promise<Object>} - The generated image data
   */
  async generateImage(prompt, metadata = {}, negativePrompt = '') {
    try {
      console.log(`Generating image with Stable Diffusion (${this.model}): ${prompt}`);
      
      if (negativePrompt) {
        console.log(`Negative prompt: ${negativePrompt}`);
      }
      
      // Call Stability API
      const response = await this._callStabilityAPI(prompt, negativePrompt);
      
      return {
        url: response.url,
        prompt,
        negativePrompt,
        model: this.model,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          generator: this.name,
          generatorVersion: this.model,
          steps: this.steps,
          cfgScale: this.cfgScale,
          stabilityResponse: response.metadata || {}
        }
      };
    } catch (error) {
      console.error('Stable Diffusion generation error:', error);
      
      // Return a placeholder image instead of failing completely
      console.log('Using placeholder image due to API error');
      return {
        url: './placeholder.svg',
        prompt,
        negativePrompt,
        model: this.model,
        error: error.message,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          generator: this.name,
          generatorVersion: this.model,
          steps: this.steps,
          cfgScale: this.cfgScale,
          error: error.message,
          isPlaceholder: true
        }
      };
    }
  }

  /**
   * Private method to call Stability AI API
   * @param {string} prompt - The image prompt
   * @param {string} negativePrompt - The negative prompt
   * @returns {Promise<Object>} - The API response
   */
  async _callStabilityAPI(prompt, negativePrompt) {
    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'output', 'images');
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    console.log(`Calling Stability AI API for model: ${this.model}`);
    
    try {
      // Determine which endpoint to use based on model
      let endpoint;
      if (this.model.includes('xl')) {
        // For SDXL models
        endpoint = `/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`;
      } else {
        // For SD 1.5, 2.1, etc.
        endpoint = `/v1/generation/${this.model}/text-to-image`;
      }

      // Prepare request body
      const body = {
        text_prompts: [
          {
            text: prompt,
            weight: 1.0
          }
        ],
        cfg_scale: this.cfgScale,
        height: 1024,
        width: 1024,
        steps: this.steps,
        samples: 1
      };
      
      // Add negative prompt if provided
      if (negativePrompt) {
        body.text_prompts.push({
          text: negativePrompt,
          weight: -1.0
        });
      }
      
      // Make the API request
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });
      
      // Handle non-success responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stability API error (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      // Parse response
      const data = await response.json();
      
      if (!data.artifacts || data.artifacts.length === 0) {
        throw new Error('No images returned from Stability API');
      }
      
      // Get the first generated image
      const image = data.artifacts[0];
      
      // Save the image to disk
      const timestamp = Date.now();
      const filename = `stable-diffusion-${timestamp}.png`;
      const filePath = path.join(outputDir, filename);
      
      // Decode base64 image and save to file
      const buffer = Buffer.from(image.base64, 'base64');
      await fs.promises.writeFile(filePath, buffer);
      
      console.log(`Saved generated image to ${filePath}`);
      
      // In a web context, we return a path relative to the output directory
      const relativePath = path.join('images', filename);
      
      return {
        url: relativePath,
        created: timestamp,
        metadata: {
          seed: image.seed,
          finishReason: image.finishReason,
          width: 1024,
          height: 1024
        }
      };
    } catch (error) {
      console.error('Error calling Stability AI API:', error.message);
      throw error;
    }
  }

  /**
   * Get Stable Diffusion capabilities
   * @returns {Object} - Object describing capabilities
   */
  getCapabilities() {
    return {
      name: this.name,
      supportsNegativePrompts: true,
      maxPromptLength: 2000,
      supportedSizes: ['512x512', '768x768', '1024x1024'],
      supportedFormats: ['png'],
      modelVersion: this.model,
      configurableSteps: true,
      configurableCfgScale: true
    };
  }
}

module.exports = StableDiffusionGenerator;