export { detectRuntime } from './runtime.js'
export { VSCodeClient } from './vscode-client.js'
export { DesktopClient } from './desktop-client.js'
export { MockClient } from './mock-client.js'
export type { PgLensClient } from './client.js'
export type { Schema, Table, Column, Index, Relation } from './types.js'

import { detectRuntime } from './runtime.js'
import { VSCodeClient } from './vscode-client.js'
import { MockClient } from './mock-client.js'
import type { PgLensClient } from './client.js'

/** Create the right client for the current runtime.
 *  - VS Code webview → VSCodeClient (postMessage bridge)
 *  - Browser / desktop → MockClient (fake data for rapid UI development)
 *  - Tauri / Electron → DesktopClient (invoke / HTTP bridge — implement when needed)
 */
export function createClient(): PgLensClient {
  const runtime = detectRuntime()
  if (runtime === 'vscode') {
    return new VSCodeClient()
  }
  return new MockClient()
}
