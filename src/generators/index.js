const DalleGenerator = require('./dalle');
const StableDiffusionGenerator = require('./stable');

/**
 * Generator factory for creating image generators
 */
class GeneratorFactory {
  constructor() {
    this.generators = {};
    
    // Register default generators
    this.register('dall-e', DalleGenerator);
    this.register('stable-diffusion', StableDiffusionGenerator);
  }

  /**
   * Register a new generator type
   * @param {string} name - The name of the generator
   * @param {Class} GeneratorClass - The generator class
   */
  register(name, GeneratorClass) {
    this.generators[name] = GeneratorClass;
  }

  /**
   * Create a new generator instance
   * @param {string} type - The type of generator to create
   * @param {Object} config - Configuration for the generator
   * @returns {ImageGenerator} - A new generator instance
   */
  create(type, config = {}) {
    const GeneratorClass = this.generators[type];
    
    if (!GeneratorClass) {
      throw new Error(`Unknown generator type: ${type}`);
    }
    
    return new GeneratorClass(config);
  }

  /**
   * Get available generator types
   * @returns {string[]} - Array of available generator types
   */
  getAvailableTypes() {
    return Object.keys(this.generators);
  }
}

// Create and export singleton instance
const factory = new GeneratorFactory();
module.exports = factory;
