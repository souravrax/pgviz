export { detectRuntime } from './runtime.js'
export { VSCodeClient } from './vscode-client.js'
export { DesktopClient } from './desktop-client.js'
export type { PgLensClient } from './client.js'
export type { Schema, Table, Column, Index, Relation } from './types.js'

import { detectRuntime } from './runtime.js'
import { VSCodeClient } from './vscode-client.js'
import { DesktopClient } from './desktop-client.js'
import type { PgLensClient } from './client.js'

/** Create the right client for the current runtime. */
export function createClient(): PgLensClient {
  const runtime = detectRuntime()
  if (runtime === 'vscode') {
    return new VSCodeClient()
  }
  return new DesktopClient()
}
