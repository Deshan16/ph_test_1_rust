import Decimal from "decimal.js";
import { billing_get_batches, billing_get_products, must_get } from "../invokes";
import { BillingBatchSearch, BillingProductSearch } from "../interfaces";

const add_row_btn = must_get<HTMLTableRowElement>(".add_row");
const search_window = must_get<HTMLDivElement>(".search_window");
const overlay = must_get<HTMLDivElement>(".overlay");
const product_search_bar = must_get<HTMLDivElement>("#search_text");
const product_table_box = must_get<HTMLDivElement>(".search_table_box");
const product_tbody = must_get<HTMLTableSectionElement>(".search_table tbody");
const clear_button = must_get<HTMLButtonElement>("#clear");
const search_text = must_get<HTMLInputElement>("#search_text");
const batch_table_box = must_get<HTMLDivElement>(".search_batch_results");
const batch_tbody = must_get<HTMLTableSectionElement>("#batch_table tbody");
const billing_tbody = must_get<HTMLTableSectionElement>("#billing_table tbody");

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
function product_row_class_picker(product_row: BillingProductSearch): string | null {
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
function batch_row_class_picker(batch_row: BillingBatchSearch): string | null {
    if (batch_row.in_expiry_period) return "expiring";
    return null;
}

async function load_data(text: string) {
    const product_rows = await billing_get_products(text);
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
            const batch_rows = await billing_get_batches(product_row.prod_id);
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
                    inp.addEventListener("blur", () => {
                        total_.innerText = String(Decimal(inp.value).times(Decimal(batch_row.unit_sell_price)));
                    });
                });
            });
        });
    });
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

function updateTotal(): void {
    let total = Decimal('0');
    document.querySelectorAll<HTMLTableRowElement>("#billing_table tbody tr").forEach(row => {
        total = total.add(Decimal(String(row.cells[5].textContent)));
    });
    document.getElementById("grand_total")!.textContent = String(total);
}

const billingBody = document.querySelector("#billing_table tbody")!;

new MutationObserver(updateTotal).observe(billingBody, {
    childList: true,
    subtree: true,
    characterData: true,
});