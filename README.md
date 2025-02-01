# VS Code LocalLLM Extension

A Visual Studio Code extension that integrates local LLM models through Ollama, providing a chat interface similar to popular AI assistants.

## Prerequisites

1. **Ollama**: Must be installed and running on your system
   - Download from: https://ollama.ai
   - After installation, pull the DeepSeek model:
     ```bash
     ollama pull deepseek-coder:latest
     ```

## Installation

1. Clone this repository to your local machine
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open the project in VS Code
4. Press `F5` to start debugging (this will open a new VS Code window with the extension loaded)

## Usage

1. Make sure Ollama is running in the background
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS)
3. Type "LocalLLM: Start" and select the command
4. A new chat interface will open in VS Code
5. Start chatting with the AI assistant

## Features

- Modern chat interface with message bubbles
- Real-time streaming responses
- Copy message functionality
- Full VS Code theme integration
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## Development

- Main extension code is in `extension.ts`
- WebView interface is defined in the `getWebviewContent()` function
- Uses the Ollama API for communication with the LLM

## Troubleshooting

If you encounter issues:

1. Ensure Ollama is running (`ollama serve` in terminal)
2. Check that the DeepSeek model is properly installed
3. Look for error messages in the VS Code Developer Tools (Help > Toggle Developer Tools)

## License

MIT
