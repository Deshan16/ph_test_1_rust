use chrono::NaiveDate;
use rust_decimal::Decimal;

/// Type definition of how Product row data coming from the database.
#[derive(sqlx::FromRow, serde::Serialize)]
pub struct InventoryProductRow {
    pub prod_id: i64,
    pub prod_type: String,
    pub name: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub reorder_level: Decimal, // Explicit serialization to string when send to frontend.
    #[serde(with = "rust_decimal::serde::str")]
    pub stock: Decimal, // sum total of all the stock of batches.
    pub in_expiry_period: bool, // if one of the batch is in the expiration period, this is true.
    pub low_stock: bool,
    pub expiry_warning_days: i64,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_value: Decimal,
    // Medicine Specific Attributes.
    pub generic_name: Option<String>,
    pub company: Option<String>,
    pub strength: Option<String>,
    pub form: Option<String>
}

/// Type definition of how Batch data of a product coming from the database.
#[derive(sqlx::FromRow, serde::Serialize)]
pub struct InventoryBatchRow {
    pub batch_id: i64,
    pub batch_number: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_bought_price: Decimal, // Explicit serialization to string when send to frontend.
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_sell_price: Decimal, // Explicit serialization to string when send to frontend.
    pub expiry_date: NaiveDate,
    #[serde(with = "rust_decimal::serde::str")]
    pub current_stock: Decimal, // Explicit serialization to string when send to frontend.
    pub in_expiry_period: bool // if the batch is in expiration period, this is true.
}

#[derive(sqlx::FromRow, serde::Serialize)]
pub struct BillingProductSearch {
    pub prod_id: i64,
    pub prod_type: String,
    pub name: String,
    pub in_expiry_period: bool,
    pub low_stock: bool,
    pub generic_name: Option<String>,
    pub company: Option<String>,
    pub strength: Option<String>,
    pub form: Option<String>
}

#[derive(sqlx::FromRow, serde::Serialize)]
pub struct BillingBatchSearch {
    pub batch_id: i64,
    pub batch_number: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_sell_price: Decimal, // Explicit serialization to string when send to frontend.
    pub expiry_date: NaiveDate,
    #[serde(with = "rust_decimal::serde::str")]
    pub current_stock: Decimal, // Explicit serialization to string when send to frontend.
    pub in_expiry_period: bool, // if the batch is in expiration period, this is true.
    pub remaining: i64
}

#[derive(serde::Deserialize)]
pub struct BillingOrderItems {
    pub batch_id: i64,
    #[serde(with = "rust_decimal::serde::str")]
    pub bought_quantity: Decimal, // Explicit deserialization to Decimal when send from frontend.
    #[allow(dead_code)]
    pub name: String, // This is here for ui purpose. Not used in backend.
    #[allow(dead_code)]
    pub unit_price: String  // This is here for ui purpose. Not used in backend.
}

#[derive(serde::Deserialize)]
pub struct BillingOrder {
    #[serde(with = "rust_decimal::serde::str")]
    pub total_amount: Decimal,
    pub payment_method: String,
    pub status: String,
    pub items: Vec<BillingOrderItems>
}

#[derive(serde::Serialize)]
pub struct BillingOrderInfo {
    pub order_id: u64,
    pub order_date: String,
    pub order_time: String
}

#[derive(sqlx::FromRow, serde::Serialize)]
pub struct ReorderItem {
    pub prod_id: i64,
    pub prod_type: String,
    pub name: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub reorder_level: Decimal, // Explicit serialization to string when send to frontend.
    #[serde(with = "rust_decimal::serde::str")]
    pub stock: Decimal, // sum total of all the stock of batches.
    #[serde(with = "rust_decimal::serde::str")]
    pub shortfall: Decimal, 
    // Medicine Specific Attributes.
    pub generic_name: Option<String>,
    pub company: Option<String>
}

#[derive(sqlx::FromRow, serde::Serialize)]
pub struct ExpiredItem {
    pub prod_id: i64,
    pub prod_type: String,
    pub name: String,
    pub batch_id: i64,
    pub batch_number: String,
    pub expiry_date: NaiveDate,
    #[serde(with = "rust_decimal::serde::str")]
    pub current_stock: Decimal, // Explicit serialization to string when send to frontend.
    // Medicine Specific Attributes.
    pub generic_name: Option<String>,
    pub company: Option<String>
}

#[derive(sqlx::FromRow, serde::Serialize)]
pub struct StockProductSearch {
    pub prod_id: i64,
    pub prod_type: String,
    pub name: String,
    pub generic_name: Option<String>,
    pub company: Option<String>,
    pub strength: Option<String>,
    pub form: Option<String>
}

#[derive(serde::Deserialize)]
pub struct BatchDetails {
    pub prod_id: i64,
    pub batch_number: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub quantity: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_bought_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_sell_price: Decimal,
    pub expiry_date: NaiveDate,
}