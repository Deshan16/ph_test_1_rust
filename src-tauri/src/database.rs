use crate::{
    error::AppErrors, 
    session::{ CurrentUser, Session, require_admin, require_login }, 
    types::{
        BatchDetails, BillingBatchSearch, BillingOrder, BillingOrderInfo, BillingProductSearch, ExpiredItem, InventoryBatchRow, InventoryProductRow, ReorderItem, StockProductSearch,
    }
};
use sqlx::MySqlPool;
use tauri::State;

/// get all the products from the database.
#[tauri::command]
pub async fn inventory_get_products(pool: State<'_, MySqlPool>, session: State<'_, Session>, text: String) -> Result<Vec<InventoryProductRow>, AppErrors> {
    require_login(&session)?;
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, InventoryProductRow>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level, p.expiry_warning_days,
                m.company, m.generic_name, m.strength, m.form,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) <= p.reorder_level AS low_stock,
                COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period,
                COALESCE(SUM(b.current_stock * b.unit_bought_price), 0) AS total_value
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
pub async fn inventory_get_batches(pool: State<'_, MySqlPool>, session: State<'_, Session>, prod_id: i64) -> Result<Vec<InventoryBatchRow>, AppErrors> {
    require_login(&session)?;
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
pub async fn inventory_update_reorder_level(pool: State<'_, MySqlPool>, session: State<'_, Session>, prod_id: i64, value: String) -> Result<(), AppErrors> {
    require_admin(&session)?;
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
pub async fn inventory_update_expiry_warning(pool: State<'_, MySqlPool>, session: State<'_, Session>, prod_id: i64, value: i64) -> Result<(), AppErrors> {
    require_admin(&session)?;
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
pub async fn billing_get_products(pool: State<'_, MySqlPool>, session: State<'_, Session>, text: String) -> Result<Vec<BillingProductSearch>, AppErrors> {
    require_login(&session)?;
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
pub async fn billing_get_batches(pool: State<'_, MySqlPool>, session: State<'_, Session>, prod_id: i32) -> Result<Vec<BillingBatchSearch>, AppErrors> {
    require_login(&session)?;
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
pub async fn login_data(pool: State<'_, MySqlPool>, session: State<'_, Session>, username: String, password: String) -> Result<Option<CurrentUser>, AppErrors> {
    let user = sqlx::query_as::<_, CurrentUser>("
            SELECT user_name, role FROM Users WHERE user_name = ? AND password = ?;
        ")
        .bind(username)
        .bind(password)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    if let Some(u) = user {
        *session.0.lock().unwrap() = Some(u.clone());
        Ok(Some(u))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn update_database(pool: State<'_, MySqlPool>, session: State<'_, Session>, order: BillingOrder) -> Result<BillingOrderInfo, AppErrors> {
    require_login(&session)?;
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    let now = chrono::Local::now();
    
    let res1 = sqlx::query("
            INSERT INTO Orders (order_date, order_time, total_amount, payment_method, order_status, discount)
            VALUES (?, ?, ?, ?, ?, ?);
        ")
        .bind(now.date_naive())
        .bind(now.time())
        .bind(&order.total_amount)
        .bind(&order.payment_method)
        .bind(&order.status)
        .bind(&order.discount)
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
pub async fn generate_reorder_list(pool: State<'_, MySqlPool>, session: State<'_, Session>, text: String) -> Result<Vec<ReorderItem>, AppErrors> {
    require_login(&session)?;
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, ReorderItem>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                m.company, m.generic_name,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                p.reorder_level - COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS shortfall
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id AND b.is_active = TRUE
            GROUP BY p.prod_id, p.name, p.reorder_level
            HAVING stock <= p.reorder_level AND (p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?)
            ORDER BY shortfall DESC, p.name;
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
pub async fn generate_expired_list(pool: State<'_, MySqlPool>, session: State<'_, Session>, text: String) -> Result<Vec<ExpiredItem>, AppErrors> {
    require_login(&session)?;
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, ExpiredItem>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                m.company, m.generic_name, m.form, m.strength,
                b.batch_id, b.batch_number, b.expiry_date, b.current_stock
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id
            WHERE b.expiry_date < CURDATE() AND (p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?)
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
pub async fn get_product_id_for_stock(pool: State<'_, MySqlPool>, session: State<'_, Session>, text: String) -> Result<Vec<StockProductSearch>, AppErrors> {
    require_admin(&session)?;
    let parameter = format!("%{}%", text);
    let ids = sqlx::query_as::<_, StockProductSearch>("
            SELECT P.prod_id, P.prod_type, P.name, M.generic_name, M.company, M.form, M.strength
            FROM Product P LEFT JOIN Medicines M ON M.prod_id = P.prod_id
            WHERE P.name LIKE ? OR M.generic_name LIKE ? OR M.company LIKE ?;
        ")
        .bind(&parameter)
        .bind(&parameter)
        .bind(&parameter)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| AppErrors::FailedToGetDataFromDatabase(e.to_string()))?;
    
    Ok(ids)
}

#[tauri::command]
pub async fn add_batch_to_database(pool: State<'_, MySqlPool>, session: State<'_, Session>, batch: BatchDetails) -> Result<(), AppErrors> {
    require_admin(&session)?;
    let mut tx = pool.begin()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    let _ = sqlx::query("
            INSERT INTO Batches (prod_id, batch_number, unit_bought_price, unit_sell_price, expiry_date, current_stock, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ")
        .bind(batch.prod_id)
        .bind(batch.batch_number)
        .bind(batch.unit_bought_price)
        .bind(batch.unit_sell_price)
        .bind(batch.expiry_date)
        .bind(batch.quantity)
        .bind(true)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;

    tx.commit()
        .await
        .map_err(|e| AppErrors::FailedToUpdateDatabase(e.to_string()))?;
    
    Ok(())
}

#[tauri::command]
pub fn get_current_user(session: State<'_, Session>) -> Option<CurrentUser> {
    session.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn logout(session: State<'_, Session>) {
    *session.0.lock().unwrap() = None;
}