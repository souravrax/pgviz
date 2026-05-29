/** Detect which runtime the app is executing in. */
export function detectRuntime(): 'vscode' | 'desktop' {
  if (typeof acquireVsCodeApi === 'function') {
    return 'vscode'
  }
  return 'desktop'
}

// VS Code API is injected by the webview environment
declare global {
  function acquireVsCodeApi(): {
    postMessage(message: unknown): void
    setState(state: unknown): void
    getState(): unknown
  }
}
