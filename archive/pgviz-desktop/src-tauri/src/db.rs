use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio_postgres::{Client, NoTls};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub name: String,
    #[serde(rename = "type")]
    pub col_type: String,
    pub nullable: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Index {
    pub name: String,
    pub columns: Vec<String>,
    pub unique: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Table {
    pub name: String,
    pub columns: Vec<Column>,
    pub primary_keys: Vec<String>,
    pub indexes: Vec<Index>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Relation {
    pub from_table: String,
    pub from_column: String,
    pub to_table: String,
    pub to_column: String,
    pub constraint_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Schema {
    pub name: String,
    pub tables: Vec<Table>,
    pub relations: Vec<Relation>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Trigger {
    pub name: String,
    pub table: String,
    pub event: String,
    pub timing: String,
    pub function: String,
    pub enabled: bool,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Function {
    pub name: String,
    pub return_type: String,
    pub arguments: String,
    pub language: String,
    pub security_type: String,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct View {
    pub name: String,
    pub definition: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MaterializedView {
    pub name: String,
    pub definition: String,
    pub has_indexes: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Sequence {
    pub name: String,
    pub data_type: String,
    pub start_value: String,
    pub min_value: String,
    pub max_value: String,
    pub increment: String,
    pub owned_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EnumType {
    pub name: String,
    pub labels: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Extension {
    pub name: String,
    pub version: String,
    pub schema: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Constraint {
    pub name: String,
    pub table: String,
    pub constraint_type: String,
    pub definition: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableSize {
    pub name: String,
    pub total_size: String,
    pub index_size: String,
    pub toast_size: String,
    pub row_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RlsPolicy {
    pub name: String,
    pub table: String,
    pub command: String,
    pub permissive: String,
    pub roles: Vec<String>,
    pub using_expr: Option<String>,
    pub check_expr: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Grant {
    pub table: String,
    pub grantee: String,
    pub privilege_type: String,
    pub is_grantable: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Metadata {
    pub triggers: Vec<Trigger>,
    pub functions: Vec<Function>,
    pub views: Vec<View>,
    pub materialized_views: Vec<MaterializedView>,
    pub sequences: Vec<Sequence>,
    pub enums: Vec<EnumType>,
    pub extensions: Vec<Extension>,
    pub constraints: Vec<Constraint>,
    pub table_sizes: Vec<TableSize>,
    pub rls_policies: Vec<RlsPolicy>,
    pub grants: Vec<Grant>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfo {
    pub name: String,
    #[serde(rename = "type")]
    pub col_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QueryResult {
    pub rows: Vec<serde_json::Value>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteResult {
    pub rows: Vec<serde_json::Value>,
    pub columns: Vec<ColumnInfo>,
    pub row_count: i64,
    pub duration: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExplainPlan {
    pub plan: serde_json::Value,
    pub settings: Option<serde_json::Value>,
    pub planning_time: Option<f64>,
    pub execution_time: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionsResult {
    pub installed: Vec<Extension>,
    pub available: Vec<AvailableExtension>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AvailableExtension {
    pub name: String,
    pub default_version: String,
    pub installed_version: Option<String>,
    pub comment: Option<String>,
}

async fn connect(url: &str) -> Result<Client, String> {
    let (client, connection) = tokio_postgres::connect(url, NoTls)
        .await
        .map_err(|e| format!("Connection failed: {e}"))?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });

    Ok(client)
}

pub async fn list_schemas(url: &str) -> Result<Vec<String>, String> {
    let client = connect(url).await?;
    let rows = client
        .query(
            "SELECT schema_name FROM information_schema.schemata
             WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
               AND schema_name NOT LIKE 'pg_temp_%'
               AND schema_name NOT LIKE 'pg_toast_temp_%'
             ORDER BY schema_name",
            &[],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| r.get::<_, String>("schema_name")).collect())
}

pub async fn extract_schema(url: &str, schema_name: &str) -> Result<Schema, String> {
    let client = connect(url).await?;

    let col_rows = client
        .query(
            "SELECT c.table_name, c.column_name, c.udt_name, c.is_nullable, c.column_default
             FROM information_schema.columns c
             WHERE c.table_schema = $1
             ORDER BY c.table_name, c.ordinal_position",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let pk_rows = client
        .query(
            "SELECT tc.table_name, kcu.column_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name
             WHERE tc.constraint_type = 'PRIMARY KEY'
               AND tc.table_schema = $1",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let fk_rows = client
        .query(
            "SELECT tc.table_name AS from_table, kcu.column_name AS from_column,
                    ccu.table_name AS to_table, ccu.column_name AS to_column, tc.constraint_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name
             JOIN information_schema.constraint_column_usage ccu
               ON ccu.constraint_name = tc.constraint_name
             WHERE tc.constraint_type = 'FOREIGN KEY'
               AND tc.table_schema = $1",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let idx_rows = client
        .query(
            "SELECT tablename, indexname, indexdef
             FROM pg_indexes
             WHERE schemaname = $1
             ORDER BY tablename, indexname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let mut tables_map: HashMap<String, Table> = HashMap::new();

    for row in &col_rows {
        let table_name: String = row.get("table_name");
        if !tables_map.contains_key(&table_name) {
            tables_map.insert(
                table_name.clone(),
                Table {
                    name: table_name.clone(),
                    columns: vec![],
                    primary_keys: vec![],
                    indexes: vec![],
                },
            );
        }
        tables_map
            .get_mut(&table_name)
            .unwrap()
            .columns
            .push(Column {
                name: row.get("column_name"),
                col_type: row.get("udt_name"),
                nullable: row.get::<_, String>("is_nullable") == "YES",
                default_value: row.get("column_default"),
            });
    }

    let mut pk_map: HashMap<String, Vec<String>> = HashMap::new();
    for row in &pk_rows {
        let table_name: String = row.get("table_name");
        let column_name: String = row.get("column_name");
        pk_map.entry(table_name).or_default().push(column_name);
    }
    for (table_name, pks) in pk_map {
        if let Some(table) = tables_map.get_mut(&table_name) {
            table.primary_keys = pks;
        }
    }

    for row in &idx_rows {
        let tablename: String = row.get("tablename");
        let indexdef: String = row.get("indexdef");
        if let Some(table) = tables_map.get_mut(&tablename) {
            let columns = if let Some(start) = indexdef.find('(') {
                if let Some(end) = indexdef.find(')') {
                    indexdef[start + 1..end]
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .collect()
                } else {
                    vec![]
                }
            } else {
                vec![]
            };
            table.indexes.push(Index {
                name: row.get("indexname"),
                columns,
                unique: indexdef.starts_with("CREATE UNIQUE"),
            });
        }
    }

    let relations: Vec<Relation> = fk_rows
        .iter()
        .map(|row| Relation {
            from_table: row.get("from_table"),
            from_column: row.get("from_column"),
            to_table: row.get("to_table"),
            to_column: row.get("to_column"),
            constraint_name: row.get("constraint_name"),
        })
        .collect();

    Ok(Schema {
        name: schema_name.to_string(),
        tables: tables_map.into_values().collect(),
        relations,
    })
}

pub async fn extract_metadata(url: &str, schema_name: &str) -> Result<Metadata, String> {
    let client = connect(url).await?;

    let triggers = client
        .query(
            "SELECT t.tgname AS name, c.relname AS table,
             array_to_string(array_remove(ARRAY[
               CASE WHEN t.tgtype::int::bit(7) & b'0000001'::bit(7) != b'0000000'::bit(7) THEN 'INSERT' END,
               CASE WHEN t.tgtype::int::bit(7) & b'0000010'::bit(7) != b'0000000'::bit(7) THEN 'UPDATE' END,
               CASE WHEN t.tgtype::int::bit(7) & b'0000100'::bit(7) != b'0000000'::bit(7) THEN 'DELETE' END,
               CASE WHEN t.tgtype::int::bit(7) & b'0001000'::bit(7) != b'0000000'::bit(7) THEN 'TRUNCATE' END
             ], NULL), ', ') AS event,
             CASE WHEN t.tgtype::int & 2 != 0 THEN 'BEFORE'
                  WHEN t.tgtype::int & 64 != 0 THEN 'INSTEAD OF'
                  ELSE 'AFTER'
             END AS timing,
             p.proname AS function, t.tgenabled != 'D' AS enabled,
             pg_get_triggerdef(t.oid) AS body
             FROM pg_trigger t
             JOIN pg_class c ON t.tgrelid = c.oid
             JOIN pg_namespace n ON c.relnamespace = n.oid
             JOIN pg_proc p ON t.tgfoid = p.oid
             WHERE NOT t.tgisinternal AND n.nspname = $1
             ORDER BY c.relname, t.tgname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let functions = client
        .query(
            "SELECT p.proname AS name,
             pg_catalog.format_type(p.prorettype, NULL) AS return_type,
             pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
             l.lanname AS language,
             CASE p.prosecdef WHEN true THEN 'DEFINER' ELSE 'INVOKER' END AS security_type,
             pg_get_functiondef(p.oid) AS body
             FROM pg_proc p
             JOIN pg_namespace n ON p.pronamespace = n.oid
             JOIN pg_language l ON p.prolang = l.oid
             WHERE n.nspname = $1 AND p.prokind IN ('f', 'p')
             ORDER BY p.proname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let views = client
        .query(
            "SELECT table_name AS name, view_definition AS definition
             FROM information_schema.views
             WHERE table_schema = $1 ORDER BY table_name",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let materialized_views = client
        .query(
            "SELECT mv.matviewname AS name, mv.definition,
             EXISTS (SELECT 1 FROM pg_indexes i
                     WHERE i.schemaname = mv.schemaname AND i.tablename = mv.matviewname) AS has_indexes
             FROM pg_matviews mv WHERE mv.schemaname = $1 ORDER BY mv.matviewname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let sequences = client
        .query(
            "SELECT s.sequencename AS name, s.data_type AS data_type,
             s.start_value AS start_value, s.min_value AS min_value,
             s.max_value AS max_value, s.increment_by AS increment,
             null::text AS owned_by
             FROM pg_sequences s WHERE s.schemaname = $1 ORDER BY s.sequencename",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let enums = client
        .query(
            "SELECT t.typname AS name,
             string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS labels
             FROM pg_type t
             JOIN pg_namespace n ON t.typnamespace = n.oid
             JOIN pg_enum e ON t.oid = e.enumtypid
             WHERE n.nspname = $1
             GROUP BY t.typname ORDER BY t.typname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let extensions = client
        .query(
            "SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema
             FROM pg_extension e
             JOIN pg_namespace n ON e.extnamespace = n.oid
             ORDER BY e.extname",
            &[],
        )
        .await
        .map_err(|e| e.to_string())?;

    let constraints = client
        .query(
            "SELECT con.conname AS name, cl.relname AS table,
             CASE con.contype
               WHEN 'c' THEN 'CHECK'
               WHEN 'u' THEN 'UNIQUE'
               WHEN 'x' THEN 'EXCLUDE'
               WHEN 'p' THEN 'PRIMARY KEY'
               WHEN 'f' THEN 'FOREIGN KEY'
               ELSE con.contype::text
             END AS type,
             pg_get_constraintdef(con.oid) AS definition
             FROM pg_constraint con
             JOIN pg_class cl ON con.conrelid = cl.oid
             JOIN pg_namespace n ON cl.relnamespace = n.oid
             WHERE n.nspname = $1
             ORDER BY cl.relname, con.conname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let table_sizes = client
        .query(
            "SELECT c.relname AS name,
             pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
             pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
             pg_size_pretty(pg_total_relation_size(c.reltoastrelid)) AS toast_size,
             COALESCE(s.n_live_tup, 0)::bigint AS row_count
             FROM pg_class c
             JOIN pg_namespace n ON c.relnamespace = n.oid
             LEFT JOIN pg_stat_user_tables s ON s.schemaname = n.nspname AND s.relname = c.relname
             WHERE n.nspname = $1 AND c.relkind = 'r'
             ORDER BY pg_total_relation_size(c.oid) DESC",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let rls_policies = client
        .query(
            "SELECT pol.polname AS name, cl.relname AS table,
             CASE pol.polcmd
               WHEN 'r' THEN 'SELECT'
               WHEN 'a' THEN 'INSERT'
               WHEN 'w' THEN 'UPDATE'
               WHEN 'd' THEN 'DELETE'
               WHEN '*' THEN 'ALL'
               ELSE pol.polcmd::text
             END AS command,
             CASE pol.polpermissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
             ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles) ORDER BY rolname) AS roles,
             pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
             pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
             FROM pg_policy pol
             JOIN pg_class cl ON pol.polrelid = cl.oid
             JOIN pg_namespace n ON cl.relnamespace = n.oid
             WHERE n.nspname = $1
             ORDER BY cl.relname, pol.polname",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    let grants = client
        .query(
            "SELECT table_name AS table, grantee, privilege_type AS privilege_type,
             is_grantable = 'YES' AS is_grantable
             FROM information_schema.role_table_grants
             WHERE table_schema = $1 AND grantee NOT IN ('postgres')
             ORDER BY table_name, grantee, privilege_type",
            &[&schema_name],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(Metadata {
        triggers: triggers
            .iter()
            .map(|r| Trigger {
                name: r.get("name"),
                table: r.get("table"),
                event: r.get("event"),
                timing: r.get("timing"),
                function: r.get("function"),
                enabled: r.get("enabled"),
                body: r.get("body"),
            })
            .collect(),
        functions: functions
            .iter()
            .map(|r| Function {
                name: r.get("name"),
                return_type: r.get("return_type"),
                arguments: r.get("arguments"),
                language: r.get("language"),
                security_type: r.get("security_type"),
                body: r.get("body"),
            })
            .collect(),
        views: views
            .iter()
            .map(|r| View {
                name: r.get("name"),
                definition: r.get("definition"),
            })
            .collect(),
        materialized_views: materialized_views
            .iter()
            .map(|r| MaterializedView {
                name: r.get("name"),
                definition: r.get("definition"),
                has_indexes: r.get("has_indexes"),
            })
            .collect(),
        sequences: sequences
            .iter()
            .map(|r| Sequence {
                name: r.get("name"),
                data_type: r.get("data_type"),
                start_value: r.get("start_value"),
                min_value: r.get("min_value"),
                max_value: r.get("max_value"),
                increment: r.get("increment"),
                owned_by: r.get("owned_by"),
            })
            .collect(),
        enums: enums
            .iter()
            .map(|r| EnumType {
                name: r.get("name"),
                labels: r
                    .get::<_, String>("labels")
                    .split(',')
                    .map(|s| s.to_string())
                    .collect(),
            })
            .collect(),
        extensions: extensions
            .iter()
            .map(|r| Extension {
                name: r.get("name"),
                version: r.get("version"),
                schema: r.get("schema"),
            })
            .collect(),
        constraints: constraints
            .iter()
            .map(|r| Constraint {
                name: r.get("name"),
                table: r.get("table"),
                constraint_type: r.get("type"),
                definition: r.get("definition"),
            })
            .collect(),
        table_sizes: table_sizes
            .iter()
            .map(|r| TableSize {
                name: r.get("name"),
                total_size: r.get("total_size"),
                index_size: r.get("index_size"),
                toast_size: r.get("toast_size"),
                row_count: r.get("row_count"),
            })
            .collect(),
        rls_policies: rls_policies
            .iter()
            .map(|r| RlsPolicy {
                name: r.get("name"),
                table: r.get("table"),
                command: r.get("command"),
                permissive: r.get("permissive"),
                roles: r.get("roles"),
                using_expr: r.get("using_expr"),
                check_expr: r.get("check_expr"),
            })
            .collect(),
        grants: grants
            .iter()
            .map(|r| Grant {
                table: r.get("table"),
                grantee: r.get("grantee"),
                privilege_type: r.get("privilege_type"),
                is_grantable: r.get("is_grantable"),
            })
            .collect(),
    })
}

pub async fn list_installed_extensions(url: &str) -> Result<Vec<Extension>, String> {
    let client = connect(url).await?;
    let rows = client
        .query(
            "SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema
             FROM pg_extension e
             JOIN pg_namespace n ON e.extnamespace = n.oid
             ORDER BY e.extname",
            &[],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows
        .iter()
        .map(|r| Extension {
            name: r.get("name"),
            version: r.get("version"),
            schema: r.get("schema"),
        })
        .collect())
}

pub async fn list_available_extensions(url: &str) -> Result<Vec<AvailableExtension>, String> {
    let client = connect(url).await?;
    let rows = client
        .query(
            "SELECT name, default_version AS default_version,
             installed_version AS installed_version, comment
             FROM pg_available_extensions ORDER BY name",
            &[],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows
        .iter()
        .map(|r| AvailableExtension {
            name: r.get("name"),
            default_version: r.get("default_version"),
            installed_version: r.get("installed_version"),
            comment: r.get("comment"),
        })
        .collect())
}

pub async fn install_extension(
    url: &str,
    extension_name: &str,
    schema_name: Option<&str>,
    version: Option<&str>,
) -> Result<(), String> {
    let client = connect(url).await?;
    let schema_clause = schema_name
        .map(|s| format!(" SCHEMA {}", s))
        .unwrap_or_default();
    let version_clause = version
        .map(|v| format!(" VERSION {}", v))
        .unwrap_or_default();
    let sql = format!(
        "CREATE EXTENSION IF NOT EXISTS {}{}{}",
        extension_name, schema_clause, version_clause
    );
    client.execute(&sql, &[]).await.map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn drop_extension(url: &str, extension_name: &str) -> Result<(), String> {
    let client = connect(url).await?;
    let sql = format!("DROP EXTENSION IF EXISTS {}", extension_name);
    client.execute(&sql, &[]).await.map_err(|e| e.to_string())?;
    Ok(())
}

fn validate_identifier(name: &str) -> Result<(), String> {
    if name.chars().next().map_or(false, |c| c.is_ascii_alphabetic() || c == '_')
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        Ok(())
    } else {
        Err(format!("Invalid identifier: {}", name))
    }
}

pub async fn query_table(
    url: &str,
    schema: &str,
    table: &str,
    page: i32,
    page_size: i32,
    sort: Option<&str>,
    filters: Option<&str>,
) -> Result<QueryResult, String> {
    validate_identifier(table)?;
    validate_identifier(schema)?;

    let client = connect(url).await?;

    let mut where_clauses: Vec<String> = Vec::new();
    let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();

    if let Some(filters_json) = filters {
        if let Ok(parsed) = serde_json::from_str::<HashMap<String, String>>(filters_json) {
            for (col, val) in parsed {
                if validate_identifier(&col).is_ok() {
                    let param_idx = params.len() + 1;
                    where_clauses.push(format!("\"{}\"::text ILIKE ${}", col, param_idx));
                    // We need owned strings for params, but we can't easily do that with Vec<&ToSql>
                    // So we'll build the query differently - inline the filter values safely
                }
            }
        }
    }

    // Because of lifetime issues with params, let's build the query with inline values for filters
    // This is less ideal but for ILIKE with %value% it's safe since we validate identifiers
    let mut filter_conditions: Vec<String> = Vec::new();
    if let Some(filters_json) = filters {
        if let Ok(parsed) = serde_json::from_str::<HashMap<String, String>>(filters_json) {
            for (col, val) in parsed {
                if validate_identifier(&col).is_ok() {
                    let escaped = val.replace("'", "''");
                    filter_conditions.push(format!("\"{}\"::text ILIKE '%{}%'", col, escaped));
                }
            }
        }
    }

    let where_sql = if filter_conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", filter_conditions.join(" AND "))
    };

    let order_sql = sort
        .and_then(|s| {
            let parts: Vec<&str> = s.split(':').collect();
            if parts.len() == 2 && validate_identifier(parts[0]).is_ok() {
                let dir = if parts[1] == "desc" { "DESC" } else { "ASC" };
                Some(format!("ORDER BY \"{}\" {}", parts[0], dir))
            } else {
                None
            }
        })
        .unwrap_or_default();

    let count_sql = format!(
        "SELECT COUNT(*) as total FROM \"{}\".\"{}\" {}",
        schema, table, where_sql
    );
    let count_row = client.query_one(&count_sql, &[]).await.map_err(|e| e.to_string())?;
    let total: i64 = count_row.get("total");

    let offset = (page - 1) * page_size;
    let data_sql = format!(
        "SELECT * FROM \"{}\".\"{}\" {} {} LIMIT {} OFFSET {}",
        schema, table, where_sql, order_sql, page_size, offset
    );
    let data_rows = client.query(&data_sql, &[]).await.map_err(|e| e.to_string())?;

    let col_rows = client
        .query(
            "SELECT column_name, udt_name FROM information_schema.columns
             WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position",
            &[&schema, &table],
        )
        .await
        .map_err(|e| e.to_string())?;

    let columns: Vec<ColumnInfo> = col_rows
        .iter()
        .map(|r| ColumnInfo {
            name: r.get("column_name"),
            col_type: r.get("udt_name"),
        })
        .collect();

    let mut rows: Vec<serde_json::Value> = Vec::new();
    for row in &data_rows {
        let mut obj = serde_json::Map::new();
        for col in &columns {
            let col_name = col.name.as_str();
            if let Ok(value) = row.try_get::<_, String>(col_name) {
                obj.insert(col.name.clone(), serde_json::Value::String(value));
            } else if let Ok(value) = row.try_get::<_, i64>(col_name) {
                obj.insert(col.name.clone(), serde_json::Value::Number(value.into()));
            } else if let Ok(value) = row.try_get::<_, bool>(col_name) {
                obj.insert(col.name.clone(), serde_json::Value::Bool(value));
            } else if let Ok(value) = row.try_get::<_, serde_json::Value>(col_name) {
                obj.insert(col.name.clone(), value);
            } else if let Ok(value) = row.try_get::<_, f64>(col_name) {
                obj.insert(
                    col.name.clone(),
                    serde_json::Number::from_f64(value)
                        .map(serde_json::Value::Number)
                        .unwrap_or(serde_json::Value::Null),
                );
            } else {
                obj.insert(col.name.clone(), serde_json::Value::Null);
            }
        }
        rows.push(serde_json::Value::Object(obj));
    }

    Ok(QueryResult {
        rows,
        total,
        page,
        page_size,
        columns,
    })
}

pub async fn execute_sql(url: &str, sql: &str) -> Result<ExecuteResult, String> {
    let trimmed = sql.trim();
    let upper = trimmed.to_ascii_uppercase();

    if !upper.starts_with("SELECT")
        && !upper.starts_with("WITH")
        && !upper.starts_with("EXPLAIN")
        && !upper.starts_with("SHOW")
    {
        return Err("Only SELECT, WITH, EXPLAIN, and SHOW queries are allowed".to_string());
    }

    let dangerous = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE",
    ];
    for keyword in &dangerous {
        if upper.contains(keyword) {
            return Err(format!(
                "Query contains forbidden operations ({})",
                keyword
            ));
        }
    }

    let client = connect(url).await?;
    let start = std::time::Instant::now();
    let result = client.query(trimmed, &[]).await.map_err(|e| e.to_string())?;
    let duration = start.elapsed().as_millis() as u64;

    let columns: Vec<ColumnInfo> = if let Some(first) = result.first() {
        first
            .columns()
            .iter()
            .map(|c| ColumnInfo {
                name: c.name().to_string(),
                col_type: format!("{}", c.type_()),
            })
            .collect()
    } else {
        vec![]
    };

    let mut rows: Vec<serde_json::Value> = Vec::new();
    for row in &result {
        let mut obj = serde_json::Map::new();
        for col in &columns {
            let col_name = col.name.as_str();
            if let Ok(value) = row.try_get::<_, String>(col_name) {
                obj.insert(col.name.clone(), serde_json::Value::String(value));
            } else if let Ok(value) = row.try_get::<_, i64>(col_name) {
                obj.insert(col.name.clone(), serde_json::Value::Number(value.into()));
            } else if let Ok(value) = row.try_get::<_, bool>(col_name) {
                obj.insert(col.name.clone(), serde_json::Value::Bool(value));
            } else if let Ok(value) = row.try_get::<_, serde_json::Value>(col_name) {
                obj.insert(col.name.clone(), value);
            } else if let Ok(value) = row.try_get::<_, f64>(col_name) {
                obj.insert(
                    col.name.clone(),
                    serde_json::Number::from_f64(value)
                        .map(serde_json::Value::Number)
                        .unwrap_or(serde_json::Value::Null),
                );
            } else {
                obj.insert(col.name.clone(), serde_json::Value::Null);
            }
        }
        rows.push(serde_json::Value::Object(obj));
    }

    Ok(ExecuteResult {
        rows,
        columns,
        row_count: result.len() as i64,
        duration,
    })
}

pub async fn explain_sql(
    url: &str,
    sql: &str,
    analyze: bool,
    buffers: bool,
) -> Result<ExplainPlan, String> {
    let trimmed = sql.trim();
    let upper = trimmed.to_ascii_uppercase();

    if !upper.starts_with("SELECT")
        && !upper.starts_with("WITH")
        && !upper.starts_with("EXPLAIN")
        && !upper.starts_with("SHOW")
        && !upper.starts_with("VALUES")
    {
        return Err("Only SELECT, WITH, EXPLAIN, SHOW, and VALUES queries are allowed".to_string());
    }

    let dangerous = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE",
    ];
    for keyword in &dangerous {
        if upper.contains(keyword) {
            return Err(format!(
                "Query contains forbidden operations ({})",
                keyword
            ));
        }
    }

    let client = connect(url).await?;

    let mut options = vec!["FORMAT JSON"];
    if analyze {
        options.push("ANALYZE");
    }
    if buffers && analyze {
        options.push("BUFFERS");
    }

    let explain_sql = format!("EXPLAIN ({}) {}", options.join(", "), trimmed);
    let row = client
        .query_one(&explain_sql, &[])
        .await
        .map_err(|e| e.to_string())?;

    let plan_value: serde_json::Value = row.get("QUERY PLAN");
    let plan_json = if let serde_json::Value::String(s) = &plan_value {
        serde_json::from_str(s).map_err(|e| e.to_string())?
    } else {
        plan_value
    };

    let plan_array = plan_json
        .as_array()
        .ok_or("Invalid EXPLAIN format")?;
    let first = plan_array
        .first()
        .ok_or("Empty EXPLAIN result")?;

    Ok(ExplainPlan {
        plan: first.get("Plan").cloned().unwrap_or(serde_json::Value::Null),
        settings: first.get("Settings").cloned(),
        planning_time: first.get("Planning Time").and_then(|v| v.as_f64()),
        execution_time: first.get("Execution Time").and_then(|v| v.as_f64()),
    })
}
