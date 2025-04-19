# Image Generation Research Tool

This project enables generation of contextual images for document summarization using AI image generation models. It parses JSON input files containing text summaries and extracts image prompts, then generates images using multiple AI models for comparison.

## Current Features

- Processes structured JSON input files with paragraphs and image tags
- Supports multiple image generation models:
  - OpenAI DALL-E 
  - Stability AI Stable Diffusion
- Generates comparative HTML output showing:
  - Original prompts
  - Generated images
  - Model information and parameters

## Project Structure

```
├── docs/              # Documentation
├── input/             # JSON input files
├── output/            # Generated HTML output and images
├── src/
│   ├── config/        # Configuration settings
│   ├── generators/    # Image generation implementations
│   ├── parser/        # JSON processing logic
│   ├── display/       # HTML display rendering
│   ├── storage/       # Output storage handling
│   └── index.js       # Main application entry point
```

## Setup

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env` file in the project root with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key_here
   STABILITY_API_KEY=your_stability_key_here
   ```

## Usage

1. Place your JSON input files in the `input/` directory
2. Run the application:
   ```
   npm start
   ```
3. Open the generated HTML file in the `output/` directory to view results

## Input JSON Format

The system expects JSON files with the following structure:
- `metadata`: Document information
- `paragraphs`: Array of paragraphs, each containing:
  - `id`: Paragraph identifier
  - `text`: Paragraph text
  - `gist_sentences`: Array of sentences, each containing:
    - `text`: Sentence text
    - `image_tag`: Prompt for image generation

## Extending

To add support for additional image generation models:
1. Create a new implementation in `src/generators/`
2. Register the new generator in `src/generators/index.js`
3. Update configuration in `src/config/default.js`

## License

MIT