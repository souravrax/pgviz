import type { PgLensClient } from './client.js'
import type { Schema } from './types.js'

/** Stub client for the desktop runtime (Tauri / HTTP / WebSocket).
 *  Replace with actual transport when the desktop app is revived. */
export class DesktopClient implements PgLensClient {
  async getSchema(): Promise<Schema> {
    throw new Error(
      'Desktop runtime is not yet implemented. ' +
        'Implement DesktopClient.getSchema() with your Tauri command or HTTP fetch.'
    )
  }

  selectTable(_tableName: string): void {
    // No-op until desktop runtime is implemented
  }

  onSelectTable(_callback: (tableName: string) => void): () => void {
    // No-op until desktop runtime is implemented
    return () => {}
  }
}
