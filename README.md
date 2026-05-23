# pgviz

A fast, native desktop app for visualizing and exploring PostgreSQL databases.

![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)
![Price](https://img.shields.io/badge/price-%2410-green)

## Features

- **Schema visualization** — Interactive entity-relationship diagrams
- **Query explorer** — Browse table data with filtering, sorting, and pagination
- **SQL execution** — Run queries with syntax highlighting via CodeMirror
- **Query analysis** — EXPLAIN plans with visual breakdowns
- **Metadata browser** — Triggers, functions, views, extensions, constraints, sequences
- **Auto-updates** — Built-in updater keeps you on the latest version
- **Native app** — Not a browser tab. Real menus, keyboard shortcuts, OS integration

## Download

**[Buy on Lemon Squeezy — $10](https://your-lemonsqueezy-link-here)**

Available for macOS (Intel & Apple Silicon), Windows, and Linux.

## Tech Stack

- **Frontend:** Next.js 16 + React + Tailwind CSS + shadcn/ui
- **Backend:** Rust + Tauri v2 + tokio-postgres
- **Desktop:** Native WebView, no Electron bloat
- **Data:** Everything stays local — connections stored in OS keyring

## Development

```bash
# Install dependencies
pnpm install

# Start dev mode (hot reload + JSON file storage)
pnpm tauri dev

# TypeScript check
pnpm exec tsc --noEmit

# Rust check
cd src-tauri && cargo check
```

**Requirements:** Node.js LTS, Rust, pnpm, and on Linux: `libwebkit2gtk-4.0-dev`, `libappindicator3-dev`

## License

PolyForm Noncommercial License 1.0.0

- **Personal / non-commercial use:** Free
- **Commercial use:** Requires a license — included with your $10 purchase on Lemon Squeezy

The source code is available for transparency and learning. The compiled binaries (signed, auto-updating, and convenient) are the product being sold.

## Support

Issues and feature requests: [GitHub Issues](https://github.com/souravrax/pgviz/issues)
