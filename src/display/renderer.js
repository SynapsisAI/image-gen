const fs = require('fs');
const path = require('path');

/**
 * HTML Renderer for displaying generated images
 */
class HtmlRenderer {
  /**
   * Create a new HTML renderer
   * @param {Object} config - Configuration settings
   */
  constructor(config = {}) {
    this.config = config;
    this.templatePath = path.join(
      config.paths?.templates || './src/display/templates',
      'index.html'
    );
  }

  /**
   * Render HTML for a batch of generated images
   * @param {Array} imageResults - Array of generated image results
   * @param {string} outputPath - Path to write the HTML file
   * @returns {Promise<string>} - Path to the written HTML file
   */
  async renderBatch(imageResults, outputPath) {
    try {
      // Group results by prompt
      const groupedResults = this._groupByPrompt(imageResults);
      
      // Prepare template data
      const templateData = {
        title: this.config.display?.title || 'Generated Images',
        generatedDate: new Date().toLocaleString(),
        items: Object.keys(groupedResults).map((prompt, index) => {
          const group = groupedResults[prompt];
          const firstItem = group[0];
          
          return {
            id: index,
            prompt: prompt,
            context: firstItem.source?.text || '',
            images: group.map(item => ({
              url: item.url,
              prompt: item.prompt,
              model: item.metadata.generator + ' (' + item.metadata.generatorVersion + ')',
              timestamp: new Date(item.metadata.timestamp).toLocaleString()
            })),
            metadataJson: JSON.stringify(group[0].metadata, null, 2)
          };
        })
      };
      
      // Read template
      const template = await fs.promises.readFile(this.templatePath, 'utf8');
      
      // Replace template variables
      const html = this._renderTemplate(template, templateData);
      
      // Write HTML file
      await fs.promises.writeFile(outputPath, html);
      
      return outputPath;
    } catch (error) {
      console.error('Error rendering HTML:', error);
      throw error;
    }
  }

  /**
   * Simple template rendering function
   * @param {string} template - Template HTML string
   * @param {Object} data - Data to render in the template
   * @returns {string} - Rendered HTML
   */
  _renderTemplate(template, data) {
    // Replace {{variable}} with data
    let result = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      
      return value !== undefined ? value : match;
    });
    
    // Handle #each blocks
    result = result.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
      const keys = key.trim().split('.');
      let value = data;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      
      if (Array.isArray(value)) {
        return value.map(item => this._renderTemplate(content, item)).join('');
      }
      
      return '';
    });
    
    return result;
  }

  /**
   * Group image results by prompt
   * @param {Array} results - Array of image results
   * @returns {Object} - Object with prompts as keys and arrays of results as values
   */
  _groupByPrompt(results) {
    const grouped = {};
    
    results.forEach(result => {
      const prompt = result.prompt;
      
      if (!grouped[prompt]) {
        grouped[prompt] = [];
      }
      
      grouped[prompt].push(result);
    });
    
    return grouped;
  }
}

module.exports = HtmlRenderer;
