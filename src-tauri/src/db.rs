use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        // Create the app data directory if it doesn't exist
        fs::create_dir_all(&app_data_dir)?;

        let db_path = app_data_dir.join("notes.db");
        let conn = Connection::open(&db_path)?;

        // Enable WAL mode for better concurrent access
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;

        // Create the notes table if it doesn't exist
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Ensure at least one row exists
            INSERT OR IGNORE INTO notes (id, content) VALUES (1, '');"
        )?;

        println!("Database initialized at: {:?}", db_path);

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }
}
