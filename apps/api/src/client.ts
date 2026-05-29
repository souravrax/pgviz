import type { Schema } from './types.js'

export interface PgLensClient {
  /** Request schema data. Resolves when the backend sends the schema. */
  getSchema(): Promise<Schema>
}
