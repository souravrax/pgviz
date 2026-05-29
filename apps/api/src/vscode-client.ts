import type { PgLensClient } from './client.js'
import type { Schema } from './types.js'

/** Client that communicates with the VS Code extension host via postMessage. */
export class VSCodeClient implements PgLensClient {
  private vscode: ReturnType<typeof acquireVsCodeApi>

  constructor() {
    this.vscode = acquireVsCodeApi()
  }

  getSchema(): Promise<Schema> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const message = event.data
        if (message?.type === 'schema') {
          window.removeEventListener('message', handler)
          resolve(message.data as Schema)
        }
      }
      window.addEventListener('message', handler)
      this.vscode.postMessage({ type: 'ready' })
    })
  }
}
