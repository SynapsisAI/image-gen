/**
 * JSON Processor for extracting image prompts and metadata
 */
class JsonProcessor {
  /**
   * Process a JSON input file to extract image prompts
   * @param {Object} jsonData - The parsed JSON data
   * @returns {Array} - Array of extracted prompts with metadata
   */
  processJson(jsonData) {
    const results = [];
    const metadata = jsonData.metadata || {};
    
    // Extract all paragraphs with image tags
    if (jsonData.paragraphs && Array.isArray(jsonData.paragraphs)) {
      jsonData.paragraphs.forEach(paragraph => {
        const paragraphId = paragraph.id;
        const paragraphText = paragraph.text;
        
        // Process each gist sentence that has an image tag
        if (paragraph.gist_sentences && Array.isArray(paragraph.gist_sentences)) {
          paragraph.gist_sentences.forEach((sentence, index) => {
            if (sentence.image_tag) {
              results.push({
                prompt: sentence.image_tag,
                source: {
                  paragraphId,
                  sentenceIndex: index,
                  text: sentence.text
                },
                metadata: {
                  ...metadata,
                  paragraphType: paragraph.structural_tag,
                  argumentRole: paragraph.argument_role,
                  gist: paragraph.gist
                }
              });
            }
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Create a batch from multiple JSON files
   * @param {Array} jsonDataArray - Array of parsed JSON objects
   * @returns {Array} - Combined array of prompts with metadata
   */
  createBatch(jsonDataArray) {
    let allResults = [];
    
    jsonDataArray.forEach(jsonData => {
      const results = this.processJson(jsonData);
      allResults = allResults.concat(results);
    });
    
    return allResults;
  }
}

module.exports = JsonProcessor;
