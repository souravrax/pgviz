import * as vscode from 'vscode'
import { PgTreeDataProvider } from './treeProvider.js'
import { registerCommands } from './commands.js'

export function activate(context: vscode.ExtensionContext) {
  // Ensure our sidebar view is visible by setting the context
  vscode.commands.executeCommand('setContext', 'pgviz:enabled', true)

  const treeProvider = new PgTreeDataProvider(context)

  const treeView = vscode.window.createTreeView('pgviz.explorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  })

  registerCommands(context, treeProvider)

  context.subscriptions.push(treeView)
}

export function deactivate() {
  // cleanup if needed
}
