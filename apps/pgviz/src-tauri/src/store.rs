use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const DB_FILE: &str = "databases.json";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseConfig {
    pub id: String,
    pub name: String,
    pub url: String,
    pub created_at: i64,
}

// ── Dev mode: plain JSON file in app config dir ────────────────────────────
#[cfg(dev)]
mod backend {
    use super::*;

    pub fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
        let mut path = app.path().app_config_dir().map_err(|e| e.to_string())?;
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
        path.push(super::DB_FILE);
        Ok(path)
    }

    pub fn load_databases(app: &tauri::AppHandle) -> Result<Vec<DatabaseConfig>, String> {
        let path = db_path(app)?;
        if !path.exists() {
            return Ok(vec![]);
        }
        let json = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&json).map_err(|e| e.to_string())
    }

    pub fn save_databases(
        app: &tauri::AppHandle,
        databases: &[DatabaseConfig],
    ) -> Result<(), String> {
        let path = db_path(app)?;
        let json = serde_json::to_string_pretty(databases).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())
    }

    pub fn delete_all(app: &tauri::AppHandle) -> Result<(), String> {
        let path = db_path(app)?;
        let _ = fs::remove_file(&path);
        Ok(())
    }
}

// ── Prod mode: OS keyring ─────────────────────────────────────────────────
#[cfg(not(dev))]
mod backend {
    use super::*;

    const SERVICE: &str = "com.pgviz.app";
    const USERNAME: &str = "databases";

    fn get_entry() -> Result<keyring::Entry, String> {
        keyring::Entry::new(SERVICE, USERNAME).map_err(|e| e.to_string())
    }

    pub fn load_databases(_app: &tauri::AppHandle) -> Result<Vec<DatabaseConfig>, String> {
        let entry = get_entry()?;
        match entry.get_password() {
            Ok(json) => serde_json::from_str(&json).map_err(|e| e.to_string()),
            Err(keyring::Error::NoEntry) => Ok(vec![]),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn save_databases(
        _app: &tauri::AppHandle,
        databases: &[DatabaseConfig],
    ) -> Result<(), String> {
        let entry = get_entry()?;
        let json = serde_json::to_string(databases).map_err(|e| e.to_string())?;
        entry.set_password(&json).map_err(|e| e.to_string())
    }

    pub fn delete_all(_app: &tauri::AppHandle) -> Result<(), String> {
        let entry = get_entry()?;
        let _ = entry.delete_credential();
        Ok(())
    }
}

// ── Commands ───────────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_databases(app: tauri::AppHandle) -> Result<Vec<DatabaseConfig>, String> {
    backend::load_databases(&app)
}

#[tauri::command]
pub fn add_database(
    app: tauri::AppHandle,
    id: String,
    name: String,
    url: String,
    created_at: i64,
) -> Result<(), String> {
    let mut databases = backend::load_databases(&app)?;
    databases.push(DatabaseConfig {
        id,
        name,
        url,
        created_at,
    });
    backend::save_databases(&app, &databases)
}

#[tauri::command]
pub fn remove_database(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut databases = backend::load_databases(&app)?;
    databases.retain(|d| d.id != id);
    if databases.is_empty() {
        backend::delete_all(&app)
    } else {
        backend::save_databases(&app, &databases)
    }
}
