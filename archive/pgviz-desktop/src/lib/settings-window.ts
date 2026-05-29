
import { Window } from "@tauri-apps/api/window"
import { Webview } from "@tauri-apps/api/webview"

export async function openSettingsWindow() {
  try {
    const settingsWindow = new Window('settings');
    settingsWindow.once('tauri://created', async () => {

    new Webview(settingsWindow, 'settings', {
      url: 'index.html?window=settings',
      x: 0,
      y: 0,
      width: 640,
      height: 520,
    })

    })
  } catch (err) {
    console.error('Failed to open settings window:', err)
  }
}
