# Pile - Project Instructions

## Build

- After fixing any bug or making code changes, always regenerate the DMG file:
  ```
  npm run build && npx electron-builder build --mac --publish never
  ```
- The DMG output is located in `release/build/`

## Architecture

- This is an Electron + React app using electron-react-boilerplate
- AI providers: OpenAI and Ollama (local). Ollama does not require an API key.
- AI context is managed in `src/renderer/context/AIContext.js`
- Settings are stored via `electron-settings`
