// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { get } from 'http';
import { Stream } from 'stream';
import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vs-extension" is now active!');

  const disposable = vscode.commands.registerCommand(
    'vs-extension.start',
    () => {
      vscode.window.showInformationMessage('LocalLLM is running!');

      const panel = vscode.window.createWebviewPanel(
        'LocalLLM',
        'LocalLLM',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === 'sendMessage') {
          const userPrompt = message.text;
          let responseText = '';

          try {
            // Send "thinking" status
            panel.webview.postMessage({
              command: 'updateStatus',
              status: 'thinking',
            });

            const streamResponse = await ollama.chat({
              model: 'deepseek-r1:latest',
              messages: [{ role: 'user', content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: 'updateResponse',
                text: responseText,
              });
            }
          } catch (error) {
            console.error(error);
            panel.webview.postMessage({
              command: 'error',
              text: 'Error: Failed to get response from DeepSeek. Please make sure Ollama is running.',
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalLLM</title>
    <style>
      /* ... Previous styles remain the same ... */
      body {
        font-family: var(--vscode-font-family);
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        height: 100vh;
        color: var(--vscode-foreground);
      }
      #chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 16px;
      }
      #messages {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .message {
        display: flex;
        gap: 12px;
        max-width: 88%;
        animation: fadeIn 0.3s ease-in-out;
      }
      .message.user {
        align-self: flex-end;
      }
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-weight: bold;
      }
      .user .avatar {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
      .assistant .avatar {
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
      }
      .message-content {
        background-color: var(--vscode-input-background);
        padding: 12px 16px;
        border-radius: 12px;
        position: relative;
      }
      .user .message-content {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
      .message-text {
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.5;
      }
      .thinking {
        opacity: 0.7;
        font-style: italic;
      }
      #input-container {
        display: flex;
        gap: 12px;
        padding: 8px;
        background-color: var(--vscode-input-background);
        border-radius: 8px;
      }
      #user-input {
        flex: 1;
        padding: 12px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        resize: none;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
      }
      #user-input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
      }
      #send-button {
        padding: 8px 16px;
        border: none;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      #send-button:hover:not(:disabled) {
        background-color: var(--vscode-button-hoverBackground);
      }
      #send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .copy-button {
        padding: 4px 8px;
        border: none;
        background-color: transparent;
        color: var(--vscode-button-foreground);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
        position: absolute;
        top: 8px;
        right: 8px;
      }
      .message-content:hover .copy-button {
        opacity: 1;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .cursor {
        display: inline-block;
        width: 2px;
        height: 15px;
        background-color: currentColor;
        margin-left: 2px;
        animation: blink 1s infinite;
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="chat-container">
      <div id="messages"></div>
      <div id="input-container">
        <textarea 
          id="user-input" 
          rows="1"
          placeholder="Type your message here..."
        ></textarea>
        <button id="send-button">Send</button>
      </div>
    </div>
    <script>
      (function() {
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        let currentAssistantMessage = null;

        function createMessageElement(text, isUser = false) {
          const messageDiv = document.createElement('div');
          messageDiv.className = \`message \${isUser ? 'user' : 'assistant'}\`;
          
          const avatar = document.createElement('div');
          avatar.className = 'avatar';
          avatar.textContent = isUser ? 'U' : 'A';
          
          const contentDiv = document.createElement('div');
          contentDiv.className = 'message-content';
          
          const textDiv = document.createElement('div');
          textDiv.className = 'message-text';
          textDiv.textContent = text;
          
          if (!isUser) {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.textContent = 'Copy';
            copyButton.onclick = () => {
              navigator.clipboard.writeText(text);
              copyButton.textContent = 'Copied!';
              setTimeout(() => {
                copyButton.textContent = 'Copy';
              }, 2000);
            };
            contentDiv.appendChild(copyButton);
          }
          
          contentDiv.appendChild(textDiv);
          messageDiv.appendChild(avatar);
          messageDiv.appendChild(contentDiv);
          
          return messageDiv;
        }

        function updateOrCreateAssistantMessage(text, isThinking = false) {
          if (!currentAssistantMessage) {
            currentAssistantMessage = createMessageElement(text);
            if (isThinking) {
              currentAssistantMessage.querySelector('.message-text').classList.add('thinking');
            }
            messagesContainer.appendChild(currentAssistantMessage);
          } else {
            const textDiv = currentAssistantMessage.querySelector('.message-text');
            textDiv.textContent = text;
            if (!isThinking) {
              textDiv.classList.remove('thinking');
            }
          }
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function sendMessage() {
          const text = userInput.value.trim();
          if (text) {
            // Add user message
            messagesContainer.appendChild(createMessageElement(text, true));
            
            // Reset current assistant message
            currentAssistantMessage = null;
            
            // Send to extension
            vscode.postMessage({ 
              command: 'sendMessage', 
              text: text 
            });
            
            // Clear input and disable button
            userInput.value = '';
            sendButton.disabled = true;
            
            // Reset textarea height
            userInput.style.height = 'auto';
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }

        // Auto-resize textarea
        userInput.addEventListener('input', () => {
          userInput.style.height = 'auto';
          userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
          sendButton.disabled = !userInput.value.trim();
        });

        // Send button click handler
        sendButton.addEventListener('click', sendMessage);

        // Enter key handler (Enter to send, Shift+Enter for new line)
        userInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
          const message = event.data;

          switch (message.command) {
            case 'updateStatus':
              if (message.status === 'thinking') {
                updateOrCreateAssistantMessage('Thinking...', true);
              }
              break;

            case 'updateResponse':
              updateOrCreateAssistantMessage(message.text);
              sendButton.disabled = false;
              break;

            case 'error':
              updateOrCreateAssistantMessage(message.text);
              currentAssistantMessage.querySelector('.message-content').style.color = 'var(--vscode-errorForeground)';
              sendButton.disabled = false;
              break;
          }
        });
      })();
    </script>
  </body>
  </html>
  `;
}

export function deactivate() {}
