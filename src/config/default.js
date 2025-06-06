/**
 * Default configuration for the image generation system
 */
module.exports = {
  // API configurations
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'dall-e-3',
      size: '1024x1024'
    },
    stability: {
      apiKey: process.env.STABILITY_API_KEY || '',
      model: 'stable-diffusion-xl-1024-v1-0',
      steps: 30,
      cfgScale: 7
    },
    'gpt-image': {
      apiKey: process.env.OPENAI_API_KEY || '',  // Uses the same OpenAI API key
      model: 'gpt-image-1',
      size: '1024x1024',
      quality: 'auto',  // Valid values: 'low', 'medium', 'high', 'auto'
      background: 'auto',
      format: 'png'
    }
  },
  
  // File paths
  paths: {
    input: './input',
    output: './output',
    templates: './src/display/templates'
  },
  
  // Default generators to use
  generators: ['dall-e', 'stable-diffusion', 'gpt-image'],
  
  // HTML display settings
  display: {
    title: 'Image Generation Research',
    itemsPerPage: 10,
    showMetadata: true,
    compareModels: true
  }
};
