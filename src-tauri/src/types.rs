use rust_decimal::Decimal;
use chrono::NaiveDate;

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct ProductRow {
    pub prod_id: i32,
    pub prod_type: String,
    pub name: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub reorder_level: Decimal,
    pub stock: Decimal,
    pub expired: bool,
    pub in_expiry_period: bool,
    // Medicine Specific Attributes.
    pub generic_name: Option<String>,
    pub company: Option<String>,
    pub strength: Option<String>,
    pub form: Option<String>
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct BatchRow {
    pub batch_id: i32,
    pub batch_number: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_bought_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub unit_sell_price: Decimal,
    pub expiry_date: NaiveDate,
    #[serde(with = "rust_decimal::serde::str")]
    pub current_stock: Decimal,
    pub expired: bool,
    pub in_expiry_period: bool
}