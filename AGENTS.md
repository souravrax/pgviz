<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# pgviz — Project Context

## What is pgviz?

A Tauri v2 desktop app for visualizing and exploring PostgreSQL databases. Next.js frontend, Rust backend. No web server — everything is local.

## Architecture

- **Frontend:** Next.js with static export (`output: 'export'`)
- **Backend:** Rust via Tauri commands (`tokio-postgres`)
- **Storage:** JSON file in dev mode (`databases.json`), OS keyring in release builds
- **Auto-updates:** Tauri updater plugin checking GitHub releases

## Distribution Model

- **Price:** $10 on Lemon Squeezy
- **License:** PolyForm Noncommercial 1.0.0 (personal free, commercial requires purchase)
- **Source:** Public on GitHub (source-available, not open source)
- **Binaries:** GitHub Actions builds for Linux, macOS (Intel + Apple Silicon), Windows
- **Updates:** Automatic via Tauri updater fetching from GitHub releases

## Key Decisions

- PostgreSQL-only (no MySQL/SQLite — depth over breadth)
- Native OS title bar and menus (no custom chrome)
- Single repo, no monorepo tooling
- New connection is a dedicated page, not a modal

## Dev Workflow

```bash
pnpm tauri dev          # Dev mode (JSON file storage)
pnpm exec tsc --noEmit  # TypeScript check
cd src-tauri && cargo check  # Rust check
```

## Release Workflow

1. Push a tag (`v*`)
2. GitHub Actions builds for all platforms
3. Download artifacts and upload to Lemon Squeezy
4. Publish GitHub release (enables auto-updater)

## Critical Files

- `src-tauri/tauri.conf.json` — Tauri config, updater endpoints
- `src-tauri/src/store.rs` — Conditional storage (JSON dev / keyring prod)
- `src-tauri/src/lib.rs` — Native menus, updater plugin registration
- `src/lib/store.ts` — Zustand store with Tauri persistence
- `src/lib/tauri-api.ts` — Frontend wrapper for `invoke()`
