import { inventory_get_batches, inventory_get_products, login_data, mustGet } from "./functions";

const username = mustGet<HTMLInputElement>("#username");
const password = mustGet<HTMLInputElement>("#password");

mustGet<HTMLButtonElement>("#submit").addEventListener("click", async () => {
	const loginData = await login_data(username.value);
	if (loginData.password = password.value) {
		window.location.href = "src/billing/page.html";
	}
});
