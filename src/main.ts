import { invoke } from "@tauri-apps/api/core";
import { mustGet } from "./functions";

const form = mustGet<HTMLFormElement>("#login-form");
const errorEl = mustGet<HTMLParagraphElement>("#login-error");

form.addEventListener("submit", async (event: SubmitEvent) => {
	event.preventDefault();
	const data = new FormData(form);
	
	const ok = await invoke("login_data", {
		username: data.get("username"),
		password: data.get("password")
	});
	
	if (ok) window.location.href = "src/billing/page.html"
	else errorEl.hidden = false;
});
