import * as vscode from 'vscode'
import { PgTreeDataProvider, type TreeNode } from './treeProvider.js'
import { extractSchema } from './db.js'
import { showSchemaVisualizer } from './webviewManager.js'

export function registerCommands(
  context: vscode.ExtensionContext,
  treeProvider: PgTreeDataProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('pgviz.addConnection', () => {
      treeProvider.addConnection()
    }),

    vscode.commands.registerCommand('pgviz.removeConnection', (node: TreeNode) => {
      if (node.type === 'connection') {
        treeProvider.removeConnection(node)
      }
    }),

    vscode.commands.registerCommand('pgviz.refreshExplorer', () => {
      treeProvider.refresh()
    }),

    vscode.commands.registerCommand('pgviz.visualizeSchema', async () => {
      // Could show quick pick of connections then schemas
      vscode.window.showInformationMessage('Select a schema from the pgviz explorer and click "Visualize Schema"')
    }),

    vscode.commands.registerCommand(
      'pgviz.visualizeSchemaFromTree',
      async (node?: TreeNode) => {
        if (!node || node.type !== 'schema') return
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Loading schema "${node.schema}"...`,
            cancellable: false,
          },
          async () => {
            const schema = await extractSchema(node.config.url, node.schema)
            showSchemaVisualizer(context, schema)
          }
        )
      }
    )
  )
}
