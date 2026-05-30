import * as vscode from 'vscode'
import { ConnectionState } from './state.js'
import { ConnectionTreeProvider } from './connectionTreeProvider.js'
import { SchemaTreeProvider } from './schemaTreeProvider.js'
import { TableTreeProvider, type TableDetailNode } from './tableTreeProvider.js'
import { registerCommands } from './commands.js'

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'pglens:enabled', true)

  const state = new ConnectionState(context)

  const connectionProvider = new ConnectionTreeProvider(context, state)
  const schemaProvider = new SchemaTreeProvider(context, state)
  const tableProvider = new TableTreeProvider()

  const connectionTreeView = vscode.window.createTreeView('pglens.connections', {
    treeDataProvider: connectionProvider,
    showCollapseAll: false,
  })

  const schemaTreeView = vscode.window.createTreeView('pglens.schemas', {
    treeDataProvider: schemaProvider,
    showCollapseAll: false,
  })

  const tableTreeView = vscode.window.createTreeView('pglens.tables', {
    treeDataProvider: tableProvider,
    showCollapseAll: true,
  })

  // Update context flags that drive viewsWelcome
  const updateContext = async () => {
    const connections = await state.getConnections()
    const active = await state.getActiveConnection()
    vscode.commands.executeCommand('setContext', 'pglens:noConnections', connections.length === 0)
    vscode.commands.executeCommand('setContext', 'pglens:noActiveConnection', connections.length > 0 && !active)
  }

  state.onDidChangeActive(() => {
    updateContext()
    schemaProvider.refresh()
  })

  // Watch for tree data changes to update context
  connectionProvider.onDidChangeTreeData(() => updateContext())

  // Initial context setup
  updateContext()

  registerCommands(context, connectionProvider, schemaProvider, tableProvider, tableTreeView, state)

  context.subscriptions.push(connectionTreeView, schemaTreeView, tableTreeView)
}

export function deactivate() {
  // cleanup if needed
}
