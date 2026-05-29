import type { PgLensClient } from './client.js'
import { getMockSchema } from './mock-schema.js'

/** Client that returns mock schema data for browser-based development.
 *  Used when the webview runs outside VS Code (e.g. `pnpm dev`). */
export class MockClient implements PgLensClient {
  async getSchema() {
    // Simulate a small network delay for realism
    await new Promise((r) => setTimeout(r, 400))
    return getMockSchema()
  }
}
