use rust_decimal::Decimal;

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct ProductRow {
    pub prod_id: i32,
    pub prod_type: String,
    pub name: String,
    pub reorder_level: Decimal,
    pub stock: i8,
    pub expired: i8,
    pub in_expiry_period: i8,
    // Medicine Specific Attributes.
    pub generic_name: Option<String>,
    pub company: Option<String>,
    pub strength: Option<String>
}