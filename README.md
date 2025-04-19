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
3. Set up your environment variables:

   **Option 1:** Run the setup script (recommended)
   ```
   npm run setup-env
   ```
   
   **Option 2:** Manually create a `.env` file in the project root with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key_here
   STABILITY_API_KEY=your_stability_key_here
   ```

4. Verify your environment is set up correctly:
   ```
   npm run check-env
   ```

## Usage

### Basic Usage

1. Place your JSON input files in the `input/` directory
2. Run the application in one of these modes:

   **Option 1:** Interactive mode (recommended)
   ```
   npm run interactive
   ```
   This will show a menu of available input files and let you choose generation options interactively.

   **Option 2:** Standard mode
   ```
   npm start
   ```
   This processes all files in the input directory.

3. The HTML output will open automatically in your browser, showing real-time generation progress

### Command Line Options

The tool supports several options for development and control:

```
Image Generation Tool - Usage:
  node src/index.js [options] [file]

Options:
  -d, --dry-run        Dry run mode (don't actually generate images)
  -f, --file FILE      Process a specific JSON file
  -l, --limit NUM      Limit the number of images generated per prompt
  -t, --total NUM      Limit the total number of images generated
  -h, --help           Show this help message
```

### Examples

```bash
# Process all files in input directory
node src/index.js

# Dry run with all files (no actual API calls)
node src/index.js --dry-run

# Process a single file
node src/index.js input/Basketball\ G.O.A.T.json

# Alternative way to process a single file
node src/index.js -f input/Digital\ Literacy.json

# Limit to 2 images per prompt
node src/index.js -l 2

# Generate only 3 images total, then stop
node src/index.js -t 3

# Process a file and stop after generating 5 images
node src/index.js -f input/Digital\ Literacy.json -t 5

# Dry run a single file with 1 image per prompt
node src/index.js -f input/Digital\ Literacy.json -l 1 -d
```

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