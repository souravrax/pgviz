import type { Schema } from './types.js'

export interface PgLensClient {
  /** Request schema data. Resolves when the backend sends the schema. */
  getSchema(): Promise<Schema>

  /** Notify the host that a table was selected in the webview. */
  selectTable(tableName: string): void

  /** Register a callback for when the host selects a table from the outside.
   *  Returns an unsubscribe function. */
  onSelectTable(callback: (tableName: string) => void): () => void
}
