import { invoke } from "@tauri-apps/api/core";
import { ProductRow, BatchRow } from "./interfaces";


export function inventory_get_products(text: string):Promise<ProductRow[]> {
	return invoke<ProductRow[]>("inventory_get_products", { text: text });
}

export function inventory_get_batches(prodId: number): Promise<BatchRow[]> {
	return invoke<BatchRow[]>("inventory_get_batches", { prodId: prodId });
}