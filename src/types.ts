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
    "critical": "Low in stock + In Expiry Period",
    "expiring": "In Expiry Period",
    "low-stock": "Stock below reorder level"
}

export interface BillingProductRow {
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

export interface BillingBatchRow {
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
    bought_quantity: string,
    name: string,
    unit_price: string
}

export interface BillingOrder {
    total_amount: string,
    payment_method: string,
    status: string,
    items: BillingOrderItem[]
}

export interface BillingOrderInfo {
    order_id: number,
    order_date: string,
    order_time: string
}

export const SHOP = { 
    name: "SHOP NAME", 
    address: "Address line", 
    phone: "000 000 0000" 
};

export const DIMENSIONS = {
    W: 80,
    M: 4,
    LINE: 4.2,
    FONT: 8
}

export interface ReorderItems {
    prod_id: number,
    prod_type: string,
    name: string,
    reorder_level: string, 
    stock: string, 
    shortfall: string, 
    // Medicine Specific Attributes.
    generic_name: string | null,
    company: string | null
}