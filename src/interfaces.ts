export interface ProductRow {
    prod_id: number,
    prod_type: string,
    name: string,
    reorder_level: string,
    stock: string,
    expired: boolean,
    in_expiry_period: boolean,
    // Medicine Specific Attributes.
    generic_name: string | null,
    company: string | null,
    strength: string | null,
    form: string | null
}

export interface BatchRow {
    batch_id: number,
    batch_number: string,
    unit_bought_price: string,
    unit_sell_price: string,
    expiry_date: string,
    current_stock: string,
    expired: boolean,
    in_expiry_period: boolean
}