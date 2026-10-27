import { invoke } from "@tauri-apps/api/core";

type Product = {
	prod_id: number;
	name: string
}

window.addEventListener("DOMContentLoaded", async() => {
	const products = await invoke<Product>("get_products");
	console.log(products);
	
});
