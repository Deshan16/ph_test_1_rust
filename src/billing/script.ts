import Decimal from "decimal.js";
import { billingGetBatches, billingGetProducts, mustGet } from "../functions";
import { BillingBatchRow, BillingOrderItem, BillingProductRow } from "../types";

const add_row_btn = mustGet<HTMLTableRowElement>(".add_row");
const search_window = mustGet<HTMLDivElement>(".search_window");
const overlay = mustGet<HTMLDivElement>(".overlay");
const product_search_bar = mustGet<HTMLDivElement>("#search_text");
const product_table_box = mustGet<HTMLDivElement>(".search_table_box");
const product_tbody = mustGet<HTMLTableSectionElement>(".search_table tbody");
const clear_button = mustGet<HTMLButtonElement>("#clear");
const search_text = mustGet<HTMLInputElement>("#search_text");
const batch_table_box = mustGet<HTMLDivElement>(".search_batch_results");
const batch_tbody = mustGet<HTMLTableSectionElement>("#batch_table tbody");
const billing_tbody = mustGet<HTMLTableSectionElement>("#billing_table tbody");
const checkout = mustGet<HTMLButtonElement>("#checkout");
const cancel = mustGet<HTMLButtonElement>("#cancel_order");
const checkout_window = mustGet<HTMLDivElement>(".checkout_window");

const cart = {
    items: [] as BillingOrderItem[],
    on_change: () => {},
    add(item: BillingOrderItem) { this.items.push(item); this.on_change() },
    clear() { this.items = []; this.on_change() }
}

cart.on_change = () => {
    checkout.disabled = cart.items.length === 0;
    cancel.disabled = cart.items.length === 0;
}

function clear_search_window(): void {
    search_text.value = '';
    product_table_box.hidden = true;
    clear_button.hidden = true;
    batch_table_box.hidden = true;
}

function close_search_window(): void {
    search_window.hidden = true;
    clear_search_window();
    overlay.classList.remove("active");
}

function create_quantity_input(): HTMLInputElement {
    const element = document.createElement("input");
    element.type = "text";
    element.value = '1';
    return element
}

/**
 *  Helper function to change styles of rows displayed to identify their state.
 *  @param product_row ProductRow that holds the info about the current row
 *  @returns class name. if nothing is wrong null
 */
function product_row_class_picker(product_row: BillingProductRow): string | null {
    if (product_row.in_expiry_period && product_row.low_stock) return "critical";
    if (product_row.in_expiry_period) return "expiring";
    if (product_row.low_stock) return "low-stock";
    return null;
}

/**
 *  Helper function to change styles of rows displayed to identify their state.
 *  @param batch_row BatchRow that holds the info about the batch.
 *  @returns class name. if nothing is wrong null
 */
function batch_row_class_picker(batch_row: BillingBatchRow): string | null {
    if (batch_row.in_expiry_period) return "expiring";
    return null;
}

async function load_data(text: string) {
    try {
        const product_rows = await billingGetProducts(text);
        product_tbody.innerHTML = '';
        product_rows.forEach((product_row) => {
            const product_trow = product_tbody.insertRow();
            
            product_trow.insertCell().innerText = String(product_row.prod_id);
            product_trow.insertCell().innerText = product_row.prod_type === "gro" ? "Grocery" : "Medicine";
            product_trow.insertCell().innerText = product_row.name;
            product_trow.insertCell().innerText = product_row.generic_name ? product_row.generic_name : '-';
            product_trow.insertCell().innerText = product_row.company ? product_row.company : '-';
            product_trow.insertCell().innerText = product_row.form ? product_row.form : '-';
            product_trow.insertCell().innerText = product_row.strength ? product_row.strength : '-';
            
            const cls = product_row_class_picker(product_row);
            if (cls) product_trow.classList.add(cls);
            
            product_trow.addEventListener("click", async () => {
                batch_table_box.hidden = false;
                batch_tbody.innerHTML = '';
                const batch_rows = await billingGetBatches(product_row.prod_id);
                batch_rows.forEach((batch_row) => {
                    const batch_trow = batch_tbody.insertRow();
                    batch_trow.insertCell().innerText = String(batch_row.batch_id);
                    batch_trow.insertCell().innerText = batch_row.batch_number;
                    batch_trow.insertCell().innerText = batch_row.unit_sell_price;
                    batch_trow.insertCell().innerText = batch_row.expiry_date;
                    batch_trow.insertCell().innerText = batch_row.current_stock;
                    const cls = batch_row_class_picker(batch_row);
                    if (cls) batch_trow.classList.add(cls);
                    batch_trow.addEventListener("click", () => {
                        close_search_window();
                        const billing_trow = billing_tbody.insertRow();
                        
                        billing_trow.insertCell().innerText = String(product_row.prod_id);
                        billing_trow.insertCell().innerText = product_row.prod_type === "gro" ? "Grocery" : "Medicine";
                        const name = billing_trow.insertCell();
                        name.innerText = product_row.name;;
                        name.title = `${product_row.name} ${product_row.generic_name} ${product_row.company} ${product_row.strength}`;
                        billing_trow.insertCell().innerText = batch_row.unit_sell_price;
                        const inp = create_quantity_input();
                        billing_trow.insertCell().appendChild(inp);
                        const total_ = billing_trow.insertCell()
                        inp.focus();
                        let prod_row: BillingOrderItem = {
                            batch_id: batch_row.batch_id,
                            bought_quantity: inp.value
                        }
                        inp.addEventListener("blur", () => {
                            const x = inp.value;
                            total_.innerText = String(Decimal(x).times(Decimal(batch_row.unit_sell_price)));
                            prod_row.bought_quantity = x;
                        });
                        
                        cart.add(prod_row);
                    });
                });
            });
        });
    } catch (err) {
        alert(err);
    }
}

add_row_btn.addEventListener("click", () => {
    search_window.hidden = false;
    overlay.classList.add("active");
    product_search_bar.focus();
});

product_search_bar.addEventListener("input", () => {
    product_table_box.hidden = search_text.value === '';
    clear_button.hidden = search_text.value === '';
    load_data(search_text.value);
});

overlay.addEventListener("click", () => {
    close_search_window();
});

clear_button.addEventListener("click", clear_search_window);

cancel.addEventListener("click", () => {
    billing_tbody.innerHTML = '';
    cart.clear();
    cancel.disabled = true;
    checkout.disabled = true;
});

checkout.addEventListener("click", async () => {
    try {
        billing_tbody.innerHTML = '';
        checkout_window.hidden = false;
        // await billingSendCart(cart.items);
    } catch (err) {
        alert(err)
    }
});

function updateTotal(): void {
    let total = Decimal('0');
    document.querySelectorAll<HTMLTableRowElement>("#billing_table tbody tr").forEach(row => {
        total = total.add(Decimal(String(row.cells[5].textContent)));
    });
    document.getElementById("grand_total")!.textContent = String(total);
}

new MutationObserver(updateTotal).observe(billing_tbody, {
    childList: true,
    subtree: true,
    characterData: true,
});