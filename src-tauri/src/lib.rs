use sqlx::mysql::MySqlPoolOptions;
use tauri::Manager;
mod database;
mod error;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            dotenvy::dotenv().ok();
            let url = std::env::var("DATABASE_LINK")?;
            let pool = tauri::async_runtime::block_on(
                MySqlPoolOptions::new().max_connections(5).connect(&url),
            )?;
            
            match tauri::async_runtime::block_on(database::deactivate_batches(&pool)) {
                Ok(n) => println!("Deactivated {n} batches"),
                Err(e) => eprintln!("Deactivate Failed {:?}", e),
            }
            
            app.manage(pool);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            database::inventory_get_products,
            database::inventory_get_batches,
            database::billing_get_products,
            database::billing_get_batches,
            database::login_data,
            database::update_database,
            database::generate_reorder_list,
            database::generate_expired_list,
            database::inventory_update_reorder_level,
            database::inventory_update_expiry_warning
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
