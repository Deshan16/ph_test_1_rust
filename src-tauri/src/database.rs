use sqlx::MySqlPool;
use tauri::State;
use crate::types::{ ProductRow, BatchRow };

/// get all the products from the database.
#[tauri::command]
pub async fn inventory_get_products(pool: State<'_, MySqlPool>, text: String) -> Result<Vec<ProductRow>, String> {
    let parameter = format!("%{}%", text);
    let rows = sqlx::query_as::<_, ProductRow>("
            SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                m.company, m.generic_name, m.strength, m.form,
                COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                COALESCE(MAX(b.expiry_date < CURDATE() AND b.current_stock > 0), 0) AS expired,
                COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
            FROM Product p
            LEFT JOIN Medicines m ON p.prod_id = m.prod_id
            LEFT JOIN Batches b ON p.prod_id = b.prod_id
            WHERE p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?
            GROUP BY p.prod_id, p.name, p.reorder_level
            ORDER BY p.prod_id;
        ")
        .bind(&parameter)
        .bind(&parameter)
        .bind(&parameter)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

/// get all the batches of a product bby searching for product id.
#[tauri::command]
pub async fn inventory_get_batches(pool: State<'_, MySqlPool>, prod_id: i32) -> Result<Vec<BatchRow>, String> {
    let rows = sqlx::query_as::<_, BatchRow>("
            SELECT b.batch_id, b.batch_number, b.unit_bought_price, b.unit_sell_price, b.expiry_date, b.current_stock,
                b.expiry_date < CURDATE() AND b.current_stock > 0 AS expired,
                b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period
            FROM Batches b
            LEFT JOIN Product p ON b.prod_id = p.prod_id
            WHERE b.prod_id = ?;
        ")
        .bind(prod_id)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows)
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
        
        let result = sqlx::query_as::<_, ProductRow>("
                SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
                    m.company, m.generic_name, m.strength,
                    COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
                    COALESCE(MAX(b.expiry_date < CURDATE() AND b.current_stock > 0), 0) AS expired,
                    COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
                FROM Product p
                LEFT JOIN Medicines m ON p.prod_id = m.prod_id
                LEFT JOIN Batches b ON p.prod_id = b.prod_id
                WHERE p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?
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
        
        let result = sqlx::query_as::<_, BatchRow>("
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