use rust_decimal::Decimal;
use chrono::NaiveDate;

/// Type definition of how Product row data coming from the database.
#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct ProductRow {
    pub prod_id: i32,
    pub prod_type: String,
    pub name: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub reorder_level: Decimal,     // Explicit serialization to string when send to frontend.
    pub stock: Decimal,             // sum total of all the stock of batches.
    pub in_expiry_period: bool,     // if one of the batch is in the expiration period, this is true.
    // Medicine Specific Attributes.
    pub generic_name: Option<String>,
    pub company: Option<String>,
    pub strength: Option<String>,
    pub form: Option<String>
}

/// Type definition of how Batch data of a product coming from the database.
#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct BatchRow {
    pub batch_id: i32,
    pub batch_number: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_bought_price: Decimal,     // Explicit serialization to string when send to frontend.
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_sell_price: Decimal,       // Explicit serialization to string when send to frontend.
    pub expiry_date: NaiveDate,
    #[serde(with = "rust_decimal::serde::str")]
    pub current_stock: Decimal,         // Explicit serialization to string when send to frontend.
    pub in_expiry_period: bool          // if the batch is in expiration period, this is true.
}