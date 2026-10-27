use sqlx::mysql::MySqlPoolOptions;
use tauri::Manager;
mod types;
mod database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            dotenvy::dotenv().ok();
            let url = std::env::var("DATABASE_LINK")?;
            let pool = tauri::async_runtime::block_on(
                MySqlPoolOptions::new()
                    .max_connections(5)
                    .connect(&url)
            )?;
            app.manage(pool);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![database::get_products])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
