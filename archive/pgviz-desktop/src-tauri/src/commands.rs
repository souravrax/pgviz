use crate::db;
use crate::db::{QueryResult, ExecuteResult, ExplainPlan, ExtensionsResult, Metadata, Schema};

#[tauri::command]
pub async fn get_schema(url: String, schema: String) -> Result<Schema, String> {
    db::extract_schema(&url, &schema).await
}

#[tauri::command]
pub async fn list_schemas(url: String) -> Result<Vec<String>, String> {
    db::list_schemas(&url).await
}

#[tauri::command]
pub async fn query_table(
    url: String,
    table: String,
    schema: String,
    page: i32,
    page_size: i32,
    sort: Option<String>,
    filters: Option<String>,
) -> Result<QueryResult, String> {
    db::query_table(&url, &schema, &table, page, page_size, sort.as_deref(), filters.as_deref()).await
}

#[tauri::command]
pub async fn execute_sql(url: String, sql: String) -> Result<ExecuteResult, String> {
    db::execute_sql(&url, &sql).await
}

#[tauri::command]
pub async fn explain_sql(
    url: String,
    sql: String,
    analyze: bool,
    buffers: bool,
) -> Result<ExplainPlan, String> {
    db::explain_sql(&url, &sql, analyze, buffers).await
}

#[tauri::command]
pub async fn get_metadata(url: String, schema: String) -> Result<Metadata, String> {
    db::extract_metadata(&url, &schema).await
}

#[tauri::command]
pub async fn list_extensions(url: String) -> Result<ExtensionsResult, String> {
    let installed = db::list_installed_extensions(&url).await?;
    let available = db::list_available_extensions(&url).await?;

    let installed_names: std::collections::HashSet<String> =
        installed.iter().map(|e| e.name.clone()).collect();

    let not_installed: Vec<db::AvailableExtension> = available
        .into_iter()
        .filter(|e| !installed_names.contains(&e.name))
        .collect();

    Ok(db::ExtensionsResult {
        installed,
        available: not_installed,
    })
}

#[tauri::command]
pub async fn install_extension(
    url: String,
    name: String,
    schema: Option<String>,
    version: Option<String>,
) -> Result<(), String> {
    db::install_extension(&url, &name, schema.as_deref(), version.as_deref()).await
}

#[tauri::command]
pub async fn drop_extension(url: String, name: String) -> Result<(), String> {
    db::drop_extension(&url, &name).await
}
