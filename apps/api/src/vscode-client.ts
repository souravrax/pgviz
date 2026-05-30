import type { PgLensClient } from './client.js'
import type { Schema } from './types.js'

/** Client that communicates with the VS Code extension host via postMessage. */
export class VSCodeClient implements PgLensClient {
  private vscode: ReturnType<typeof acquireVsCodeApi>
  private selectTableListeners: ((tableName: string) => void)[] = []

  constructor() {
    this.vscode = acquireVsCodeApi()
    window.addEventListener('message', (event) => {
      const message = event.data
      if (message?.type === 'selectTable') {
        this.selectTableListeners.forEach((cb) => cb(message.tableName as string))
      }
    })
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

  selectTable(tableName: string): void {
    this.vscode.postMessage({ type: 'selectTable', tableName })
  }

  onSelectTable(callback: (tableName: string) => void): () => void {
    this.selectTableListeners.push(callback)
    return () => {
      this.selectTableListeners = this.selectTableListeners.filter((cb) => cb !== callback)
    }
  }
}
