import { inventory_get_batches, inventory_get_products } from "./invokes";

window.addEventListener("DOMContentLoaded", async () => {
	const products = await inventory_get_products("")
	console.log(products);
	const batches= await inventory_get_batches(5);
	console.log(batches);
});
