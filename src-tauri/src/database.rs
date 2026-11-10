use sqlx::MySqlPool;
use tauri::State;
use crate::{error::AppErrors, types::{ BillingBatchSearch, BillingOrderItems, BillingProductSearch, InventoryBatchRow, InventoryProductRow, Users }};

/// get all the products from the database.
#[tauri::command]
pub async fn inventory_get_products(pool: State<'_, MySqlPool>, text: String) -> Result<Vec<InventoryProductRow>, AppErrors> {
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, InventoryProductRow>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                m.company, m.generic_name, m.strength, m.form,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) <= p.reorder_level AS low_stock,
                COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id
            WHERE (p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?) AND b.is_active = TRUE
            GROUP BY p.prod_id, p.name, p.reorder_level
            ORDER BY p.prod_id;
        ")
        .bind(&parameter)
        .bind(&parameter)
        .bind(&parameter)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    Ok(rows)
}

/// get all the batches of a product bby searching for product id.
#[tauri::command]
pub async fn inventory_get_batches(pool: State<'_, MySqlPool>, prod_id: i32) -> Result<Vec<InventoryBatchRow>, AppErrors> {
    let rows = sqlx::query_as::<_, InventoryBatchRow>("
            SELECT b.batch_id, b.batch_number, b.unit_bought_price, b.unit_sell_price, b.expiry_date, b.current_stock,
                b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period
            FROM Batches b
            LEFT JOIN Product p ON b.prod_id = p.prod_id
            WHERE b.prod_id = ? AND b.is_active = TRUE;
        ")
        .bind(prod_id)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    Ok(rows)
}

#[tauri::command]
pub async fn billing_get_products(pool: State<'_, MySqlPool>, text: String) -> Result<Vec<BillingProductSearch>, AppErrors> {
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, BillingProductSearch>("
            SELECT p.prod_id, p.prod_type, p.name,
                m.company, m.generic_name, m.form, m.strength,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) <= p.reorder_level AS low_stock,
                COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id
            WHERE (p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?) AND b.is_active = TRUE
            GROUP BY p.prod_id, p.name, p.reorder_level
            ORDER BY p.prod_id;
        ")
        .bind(&parameter)
        .bind(&parameter)
        .bind(&parameter)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    Ok(rows)
}

#[tauri::command]
pub async fn billing_get_batches(pool: State<'_, MySqlPool>, prod_id: i32) -> Result<Vec<BillingBatchSearch>, AppErrors> {
    let rows = sqlx::query_as::<_, BillingBatchSearch>("
            SELECT b.batch_id, b.batch_number, b.unit_sell_price, b.expiry_date, b.current_stock,
                b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period
            FROM Batches b
            LEFT JOIN Product p ON b.prod_id = p.prod_id
            WHERE b.prod_id = ? AND b.is_active = TRUE;
        ")
        .bind(prod_id)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    Ok(rows)
}

#[tauri::command]
pub async fn login_data(pool: State<'_, MySqlPool>, text: String) -> Result<Users, String> {
    let row = sqlx::query_as::<_, Users>("
            SELECT password, account_type FROM Users WHERE user_name = ?
        ")
        .bind(text)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub async fn update_database(pool: State<'_, MySqlPool>, items:  Vec<BillingOrderItems>) -> Result<(), AppErrors> {
    for item in &items {
        let _ = sqlx::query("
                UPDATE Batches SET current_stock = current_stock - ? 
                WHERE batch_id = ? AND current_stock >= ?;
            ")
            .bind(item.bought_quantity)
            .bind(item.batch_id)
            .bind(item.bought_quantity)
            .execute(pool.inner())
            .await
            .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    }
    Ok(())
}

pub async fn deactivate_batches(pool: &MySqlPool) -> Result<u64, AppErrors> {
    let result = sqlx::query("
            UPDATE Batches SET is_active = FALSE
            WHERE is_active = TRUE AND (current_stock <= 0 OR expiry_date < CURDATE())
        ")
        .execute(pool)
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    Ok(result.rows_affected())
}


#[cfg(test)]
mod test {
    use super::*;
    use sqlx::mysql::MySqlPoolOptions;
    
    #[tokio::test]
    async fn query_1() {
        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .connect("mysql://root:Deshan.02@localhost/ph_t_3")
            .await
            .expect("Failed to connect to the database for testing");
        
        let parameter = "%%".to_string();
        
        let result = sqlx::query_as::<_, InventoryProductRow>("
                SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                    m.company, m.generic_name, m.strength, m.form,
                    COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                    COALESCE(MAX(b.expiry_date < CURDATE() AND b.current_stock > 0), 0) AS expired,
                    COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
                FROM Product p
                LEFT JOIN Medicines m ON p.prod_id = m.prod_id
                LEFT JOIN Batches b ON p.prod_id = b.prod_id
                WHERE (p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?) AND b.is_active = TRUE
                GROUP BY p.prod_id, p.name, p.reorder_level
                ORDER BY p.prod_id;
            ")
            .bind(&parameter)
            .bind(&parameter)
            .bind(&parameter)
            .fetch_all(&pool)
            .await;
        
        match result {
            Ok(rows) => println!("{:?}", rows[1]),
            Err(err) => eprintln!("{:?}", err),
        }
    }
    
    
    #[tokio::test]
    async fn query_2() {
        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .connect("mysql://root:Deshan.02@localhost/ph_t_3")
            .await
            .expect("Failed to connect to the database for testing");
        
        let result = sqlx::query_as::<_, InventoryBatchRow>("
                SELECT b.batch_id, b.batch_number, b.unit_bought_price, b.unit_sell_price, b.expiry_date, b.current_stock,
                    b.expiry_date < CURDATE() AND b.current_stock > 0 AS expired,
                    b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period
                FROM Batches b
                LEFT JOIN Product p ON b.prod_id = p.prod_id
                WHERE b.prod_id = ?;
            ")
            .bind(5)
            .fetch_all(&pool)
            .await;
        
        match result {
            Ok(rows) => println!("{:?}", rows[0]),
            Err(err) => eprintln!("{:?}", err),
        }
    }
}