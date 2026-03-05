# Changelog

All notable changes to Pile are documented here.

## [1.1.0] - 2026-03-05

### Added

- **GitHub Auto-Sync** — Each pile can now be backed up and synced to a private GitHub repository automatically.
  - After every note save, a debounced sync runs 5 seconds later (commit + push).
  - Sync indicator in the nav bar: grey (idle) → yellow pulsing (syncing) → green (synced) → red (error).
  - Manual "Sync Now" button in Settings for immediate push.
  - "Connect & Push" button in Settings to initialise a new repo or reconnect an existing one.
  - Optional Personal Access Token (PAT) — if left blank, system git credentials (SSH keys / macOS Keychain) are used instead.
  - PAT is stored encrypted via Electron `safeStorage` (never written to disk in plain text).
  - Commit messages use a `YYYY-MM-DD HH:MM:SS` timestamp format (same convention as the Obsidian Git plugin).
  - On app launch or pile switch, an initial sync runs automatically if sync is enabled.
  - Git user identity falls back to `Pile <pile@local>` only when no global git config is present.

### Fixed

- Fix large text paste failing in editor.
- Fix text paste not working in editor.
- Fix Reflect button greyed out when using Ollama provider.

## [1.0.0] - Initial release

- Core journaling app with local markdown storage.
- AI reflections via OpenAI API or Ollama (local).
- Highlight / card type system with custom colours.
- Tag support and semantic search with embeddings.
- Dark/light theme support.
