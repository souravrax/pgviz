import * as vscode from 'vscode'
import { ConnectionState, type ConnectionConfig } from './state.js'
import { listSchemas } from './db.js'

export type TreeNode =
  | { type: 'connection'; config: ConnectionConfig }
  | { type: 'schema'; config: ConnectionConfig; schema: string }
  | { type: 'table'; config: ConnectionConfig; schema: string; table: string }

export class PgTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private state: ConnectionState

  constructor(private context: vscode.ExtensionContext) {
    this.state = new ConnectionState(context)
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  async getTreeItem(element: TreeNode): Promise<vscode.TreeItem> {
    switch (element.type) {
      case 'connection': {
        const item = new vscode.TreeItem(
          element.config.name,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.iconPath = new vscode.ThemeIcon('database')
        item.contextValue = 'connection'
        item.tooltip = element.config.url
        return item
      }
      case 'schema': {
        const item = new vscode.TreeItem(
          element.schema,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.iconPath = new vscode.ThemeIcon('symbol-namespace')
        item.contextValue = 'schema'
        item.command = {
          command: 'pgviz.visualizeSchemaFromTree',
          title: 'Visualize Schema',
          arguments: [element],
        }
        return item
      }
      case 'table': {
        const item = new vscode.TreeItem(
          element.table,
          vscode.TreeItemCollapsibleState.None
        )
        item.iconPath = new vscode.ThemeIcon('symbol-class')
        item.contextValue = 'table'
        return item
      }
    }
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!element) {
      const connections = await this.state.getConnections()
      return connections.map((config: ConnectionConfig) => ({ type: 'connection' as const, config }))
    }

    if (element.type === 'connection') {
      try {
        const showInternal = vscode.workspace.getConfiguration('pgviz').get<boolean>('showInternalSchemas', false)
      const schemas = await listSchemas(element.config.url, showInternal)
      return schemas.map((schema: string) => ({
        type: 'schema' as const,
        config: element.config,
        schema,
      }))
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to list schemas: ${err}`)
        return []
      }
    }

    if (element.type === 'schema') {
      // In the future we could list tables here; for now just leaf nodes
      return []
    }

    return []
  }

  async addConnection(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Connection name (e.g., local dev)',
      placeHolder: 'My Database',
    })
    if (!name) return

    const url = await vscode.window.showInputBox({
      prompt: 'PostgreSQL connection URL',
      placeHolder: 'postgres://user:pass@localhost:5432/dbname',
      validateInput: (value) => {
        if (!value) return 'Connection URL is required'
        if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
          return 'URL must start with postgres:// or postgresql://'
        }
        return null
      },
    })
    if (!url) return

    try {
      const showInternal = vscode.workspace.getConfiguration('pgviz').get<boolean>('showInternalSchemas', false)
      await listSchemas(url, showInternal)
    } catch (err) {
      const proceed = await vscode.window.showWarningMessage(
        `Could not connect: ${err}. Save anyway?`,
        'Yes',
        'No'
      )
      if (proceed !== 'Yes') return
    }

    await this.state.addConnection(name, url)
    this.refresh()
  }

  async removeConnection(node: TreeNode & { type: 'connection' }): Promise<void> {
    await this.state.removeConnection(node.config.id)
    this.refresh()
  }
}
