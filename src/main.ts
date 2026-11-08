import { inventory_get_batches, inventory_get_products, login_data, must_get } from "./invokes";

const username = must_get<HTMLInputElement>("#username");
const password = must_get<HTMLInputElement>("#password");

must_get<HTMLButtonElement>("#submit").addEventListener("click", async () => {
	const loginData = await login_data(username.value);
	if (loginData.password = password.value) {
		window.location.href = "src/billing/page.html";
	}
});
