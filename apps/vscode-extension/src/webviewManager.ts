import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import type { Schema } from './db.js'
import type { TableTreeProvider, TableDetailNode } from './tableTreeProvider.js'

const panelMap = new Map<string, vscode.WebviewPanel>()

export function showSchemaVisualizer(
  context: vscode.ExtensionContext,
  schema: Schema,
  tableProvider?: TableTreeProvider,
  tableTreeView?: vscode.TreeView<TableDetailNode>
) {
  const panelId = `pglens.schema.${schema.name}`

  if (panelMap.has(panelId)) {
    const existing = panelMap.get(panelId)!
    existing.reveal(vscode.ViewColumn.One)
    existing.webview.postMessage({ type: 'schema', data: schema })
    return
  }

  const panel = vscode.window.createWebviewPanel(
    'pglens.schema',
    `Schema: ${schema.name}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media', 'webview')],
    }
  )

  panelMap.set(panelId, panel)

  panel.onDidDispose(() => {
    panelMap.delete(panelId)
  })

  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri)

  // Send schema data once webview is ready
  const readyDisposable = panel.webview.onDidReceiveMessage((message) => {
    if (message.type === 'ready') {
      panel.webview.postMessage({ type: 'schema', data: schema })
      readyDisposable.dispose()
    }
    if (message.type === 'selectTable' && tableProvider && tableTreeView) {
      // Focus the Tables view in the sidebar
      vscode.commands.executeCommand('pglens.tables.focus')
      // Reveal the selected table in the tree
      const node = tableProvider.getTableNode(message.tableName as string)
      if (node) {
        Promise.resolve(tableTreeView.reveal(node, { select: true, expand: true })).catch(() => {})
      }
    }
  })

  panel.onDidDispose(() => readyDisposable.dispose())
}

/** Select a table in an already-open webview panel. */
export function selectTableInWebview(schemaName: string, tableName: string) {
  const panelId = `pglens.schema.${schemaName}`
  const panel = panelMap.get(panelId)
  if (panel) {
    panel.reveal(vscode.ViewColumn.One)
    panel.webview.postMessage({ type: 'selectTable', tableName })
  }
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const webviewBaseUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'webview')
  )

  const indexHtmlPath = vscode.Uri.joinPath(extensionUri, 'media', 'webview', 'index.html')
  
  try {
    let html = fs.readFileSync(indexHtmlPath.fsPath, 'utf-8')
    
    // Replace relative asset paths with webview URIs
    html = html.replace(
      /(src|href)="\.\/assets\//g,
      `$1="${webviewBaseUri}/assets/`
    )
    
    // Add VS Code API script and CSP
    const cspSource = webview.cspSource
    const csp = `default-src 'none'; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} data:; connect-src ${cspSource};`
    
    html = html.replace(
      '<head>',
      `<head>
    <meta http-equiv="Content-Security-Policy" content="${csp}">`
    )
    
    return html
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to load webview content: ${err}`)
    return `<!DOCTYPE html><html><body>Error loading webview</body></html>`
  }
}
