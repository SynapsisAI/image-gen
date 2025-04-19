/**
 * Base class for all image generators.
 */
class ImageGenerator {
  /**
   * Create a new image generator instance
   * @param {Object} config - Configuration settings
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Generate an image from a prompt
   * @param {string} prompt - The image generation prompt
   * @param {Object} metadata - Additional metadata for the image
   * @returns {Promise<Object>} - The generated image data
   */
  async generateImage(prompt, metadata = {}) {
    throw new Error('Method must be implemented by subclass');
  }

  /**
   * Get the capabilities of this generator
   * @returns {Object} - Object describing the capabilities
   */
  getCapabilities() {
    return {
      name: this.name,
      supportsNegativePrompts: false,
      maxPromptLength: 0,
      supportedSizes: [],
      supportedFormats: []
    };
  }
}

module.exports = ImageGenerator;
