use tauri::Manager;

mod db;

#[tauri::command]
fn save_note(content: String, state: tauri::State<'_, db::Database>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE notes SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        rusqlite::params![content],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_note(state: tauri::State<'_, db::Database>) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let result: Result<String, _> = conn.query_row(
        "SELECT content FROM notes WHERE id = 1",
        [],
        |row| row.get(0),
    );
    match result {
        Ok(content) => Ok(content),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let database = db::Database::new(app_data_dir).expect("failed to initialize database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_note, load_note])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
