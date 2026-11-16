import { invoke } from "@tauri-apps/api/core";
import { InventoryProductRow, InventoryBatchRow, BillingProductRow, BillingBatchRow, UserData, BillingOrderItem } from "./types";

/**
 * 	A function wraps around the invoke for get product rows for inventory from database.
 *  @param text text that use to query in the database to narrow down the product.
 *  @returns Array containing the products.
 */ 
export function inventory_get_products(text: string): Promise<InventoryProductRow[]> {
	return invoke<InventoryProductRow[]>("inventory_get_products", { text: text });
}

/**
 *  A function wraps around the invoke for get batch rows for inventory from database.
 *  @param prodId ID of the product that need to expand to see all of its batches.
 *  @returns Array containing the batches.
 */
export function inventory_get_batches(prodId: number): Promise<InventoryBatchRow[]> {
	return invoke<InventoryBatchRow[]>("inventory_get_batches", { prodId: prodId });
}

/**
 * 	A function wraps around the invoke for get product rows for billing from database.
 *  @param text text that use to query in the database to narrow down the product.
 *  @returns Array containing the products.
 */
export function billingGetProducts(text: string): Promise<BillingProductRow[]> {
	return invoke<BillingProductRow[]>("billing_get_products", { text: text });
}

/**
 *  A function wraps around the invoke for get batch rows for billing from database.
 *  @param prodId ID of the product that need to expand to see all of its batches.
 *  @returns Array containing the batches.
 */
export function billingGetBatches(prodId: number): Promise<BillingBatchRow[]> {
	return invoke<BillingBatchRow[]>("billing_get_batches", { prodId: prodId })
}

/**
 *  Helper function to get html elements to typescript.
 *  throws an error if the element is not found.
 *  @param selector Selector of the element that need to catch.
 *  @returns The element.
 */
export function mustGet<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`'${selector}' is not found`);
	return element;
}

export function login_data(text: string): Promise<UserData> {
	return invoke<UserData>("login_data", { text: text });
}

export function billingSendCart(batchList: BillingOrderItem[]) {
	return invoke<BillingOrderItem[]>("update_database", { items: batchList })
}

/**
 *  Helper function to change styles of rows displayed to identify their state.
 *  @param productRow ProductRow that holds the info about the current row
 *  @returns class name. if nothing is wrong null
 */
export function prodRowColorPicker(productRow: InventoryProductRow | BillingProductRow): string | null {
    if (productRow.in_expiry_period && productRow.low_stock) return "critical";
    if (productRow.in_expiry_period) return "expiring";
    if (productRow.low_stock) return "low-stock";
    return null;
}


/**
 *  Helper function to change styles of rows displayed to identify their state.
 *  @param batchRow BatchRow that holds the info about the batch.
 *  @returns class name. if nothing is wrong null
 */
export function batchRowColorPicker(batchRow: InventoryBatchRow | BillingBatchRow): string | null {
    if (batchRow.in_expiry_period) return "expiring";
    return null;
}