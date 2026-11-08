import { invoke } from "@tauri-apps/api/core";
import { InventoryProductRow, InventoryBatchRow, BillingProductSearch, BillingBatchSearch, UserData } from "./interfaces";

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
export function billing_get_products(text: string): Promise<BillingProductSearch[]> {
	return invoke<BillingProductSearch[]>("billing_get_products", { text: text });
}

/**
 *  A function wraps around the invoke for get batch rows for billing from database.
 *  @param prodId ID of the product that need to expand to see all of its batches.
 *  @returns Array containing the batches.
 */
export function billing_get_batches(prodId: number): Promise<BillingBatchSearch[]> {
	return invoke<BillingBatchSearch[]>("billing_get_batches", { prodId: prodId })
}

/**
 *  Helper function to get html elements to typescript.
 *  throws an error if the element is not found.
 *  @param selector Selector of the element that need to catch.
 *  @returns The element.
 */
export function must_get<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`'${selector}' is not found`);
	return element;
}

export function login_data(text: string): Promise<UserData> {
	return invoke<UserData>("login_data", { text: text });
}