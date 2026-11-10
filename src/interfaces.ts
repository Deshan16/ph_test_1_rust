/**
 *  Interface representing the product data coming from backend.
 */
export interface InventoryProductRow {
    prod_id: number,
    prod_type: string,
    name: string,
    reorder_level: string,
    stock: string,
    in_expiry_period: boolean,
    low_stock: boolean
    // Medicine Specific Attributes.
    generic_name: string | null,
    company: string | null,
    strength: string | null,
    form: string | null,
}

/**
 *  Interface representing the batch data of a product also coming from backend.
 */
export interface InventoryBatchRow {
    batch_id: number,
    batch_number: string,
    unit_bought_price: string,
    unit_sell_price: string,
    expiry_date: string,
    current_stock: string,
    in_expiry_period: boolean
}

/**
 *  Contain the message that need to displayed on in the tooltip.
 */
export const LABELS: Record<string, string> = {
    "expired": "Expired",
    "expiring": "In Expiry Period",
    "low-stock": "Stock below reorder level"
}

export interface BillingProductSearch {
    prod_id: number,
    prod_type: string,
    name: string,
    in_expiry_period: boolean,
    low_stock: boolean,
    generic_name: string | null,
    company: string | null,
    strength: string | null,
    form: string | null
}

export interface BillingBatchSearch {
    batch_id: number,
    batch_number: string,
    unit_sell_price: string,
    expiry_date: string,
    current_stock: string,
    in_expiry_period: boolean 
}

export interface UserData {
    password: string,
    account_type: string
}

export interface BillingOrderItem {
    batch_id: number,
    bought_quantity: string
}