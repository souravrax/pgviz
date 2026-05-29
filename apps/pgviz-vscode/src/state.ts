import * as vscode from 'vscode'

export type ConnectionConfig = {
  id: string
  name: string
  url: string
}

const CONNECTIONS_KEY = 'pgviz.connections'

export class ConnectionState {
  constructor(private context: vscode.ExtensionContext) {}

  async getConnections(): Promise<ConnectionConfig[]> {
    const raw = this.context.globalState.get<string>(CONNECTIONS_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as ConnectionConfig[]
      return parsed
    } catch {
      return []
    }
  }

  async addConnection(name: string, url: string): Promise<ConnectionConfig> {
    const connections = await this.getConnections()
    const id = crypto.randomUUID()
    const config: ConnectionConfig = { id, name, url }
    connections.push(config)
    await this.context.globalState.update(CONNECTIONS_KEY, JSON.stringify(connections))
    return config
  }

  async removeConnection(id: string): Promise<void> {
    const connections = await this.getConnections()
    const filtered = connections.filter((c) => c.id !== id)
    await this.context.globalState.update(CONNECTIONS_KEY, JSON.stringify(filtered))
  }
}
