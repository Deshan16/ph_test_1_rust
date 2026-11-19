use crate::{
    error::AppErrors, types::{
        BillingBatchSearch, BillingOrder, BillingOrderInfo, BillingProductSearch, ExpiredItem, InventoryBatchRow, InventoryProductRow, ReorderItem,
    },
};
use sqlx::MySqlPool;
use tauri::State;

/// get all the products from the database.
#[tauri::command]
pub async fn inventory_get_products(pool: State<'_, MySqlPool>, text: String) -> Result<Vec<InventoryProductRow>, AppErrors> {
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, InventoryProductRow>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level, p.expiry_warning_days,
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
pub async fn inventory_get_batches(pool: State<'_, MySqlPool>, prod_id: i64) -> Result<Vec<InventoryBatchRow>, AppErrors> {
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
pub async fn inventory_update_reorder_level(pool: State<'_, MySqlPool>, prod_id: i64, value: String) -> Result<(), AppErrors> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    let res = sqlx::query("
            UPDATE Product SET reorder_level = ?
            WHERE prod_id = ?
        ")
        .bind(value)
        .bind(prod_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    if res.rows_affected() == 0 {
        return Err(AppErrors::FailedToUpdateDatabase("Zero rows affected".to_string()));
    }
    
    tx.commit()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    Ok(())
}

#[tauri::command]
pub async fn inventory_update_expiry_warning(pool: State<'_, MySqlPool>, prod_id: i64, value: String) -> Result<(), AppErrors> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    let res = sqlx::query("
            UPDATE Product SET expiry_warning_days = ?
            WHERE prod_id = ?
        ")
        .bind(value)
        .bind(prod_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    if res.rows_affected() == 0 {
        return Err(AppErrors::FailedToUpdateDatabase("Zero rows affected".to_string()));
    }
    
    tx.commit()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    Ok(())
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
                b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period,
                b.expiry_date - CURDATE() AS remaining
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
pub async fn login_data(pool: State<'_, MySqlPool>, username: String, password: String) -> Result<bool, String> {
    let found: i64 = sqlx::query_scalar("
            SELECT EXISTS(SELECT 1 FROM Users WHERE user_name = ? AND password = ?);
        ")
        .bind(username)
        .bind(password)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(found == 1)
}

#[tauri::command]
pub async fn update_database(pool: State<'_, MySqlPool>, order: BillingOrder) -> Result<BillingOrderInfo, AppErrors> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    let now = chrono::Local::now();
    
    let res1 = sqlx::query("
            INSERT INTO Orders (order_date, order_time, total_amount, payment_method, order_status)
            VALUES (?, ?, ?, ?, ?);
        ")
        .bind(now.date_naive())
        .bind(now.time())
        .bind(&order.total_amount)
        .bind(&order.payment_method)
        .bind(&order.status)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    let order_id = res1.last_insert_id();
    
    for item in &order.items {
        let res2 = sqlx::query("
                UPDATE Batches SET current_stock = current_stock - ?
                WHERE batch_id = ? AND current_stock >= ?;
            ")
            .bind(&item.bought_quantity)
            .bind(item.batch_id)
            .bind(&item.bought_quantity)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
        
        
        if res2.rows_affected() == 0 {
            return Err(AppErrors::FailedToUpdateDatabase(
                "No rows are updated".to_string(),
            ));
        }
        
        sqlx::query("
                UPDATE Batches SET is_active = FALSE WHERE batch_id = ? AND current_stock <= 0;
            ")
            .bind(item.batch_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
        
        
        sqlx::query("
                INSERT INTO Order_Details (order_id, batch_id, bought_quantity)
                VALUES (?, ?, ?)
            ")
            .bind(order_id)
            .bind(item.batch_id)
            .bind(item.bought_quantity)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    }
    
    tx.commit()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    Ok(BillingOrderInfo {
        order_id,
        order_date: now.format("%Y-%m-%d").to_string(),
        order_time: now.format("%H:%M:%S").to_string(),
    })
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

#[tauri::command]
pub async fn generate_reorder_list(pool: State<'_, MySqlPool>) -> Result<Vec<ReorderItem>, AppErrors> {
    let rows = sqlx::query_as::<_, ReorderItem>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                m.company, m.generic_name,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                p.reorder_level - COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS shortfall
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id AND b.is_active = TRUE
            GROUP BY p.prod_id, p.name, p.reorder_level
            HAVING stock <= p.reorder_level
            ORDER BY shortfall DESC, p.name;
        ")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    Ok(rows)
}

#[tauri::command]
pub async fn generate_expired_list(pool: State<'_, MySqlPool>) -> Result<Vec<ExpiredItem>, AppErrors> {
    let rows = sqlx::query_as::<_, ExpiredItem>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                m.company, m.generic_name, m.form, m.strength,
                b.batch_id, b.batch_number, b.expiry_date, b.current_stock
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id
            WHERE b.expiry_date < CURDATE()
            ORDER BY p.prod_id;
        ").fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    Ok(rows)
}