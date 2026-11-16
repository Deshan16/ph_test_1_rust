import { LABELS, InventoryProductRow } from "../types";
import { batchRowColorPicker, inventory_get_batches, inventory_get_products, mustGet, prodRowColorPicker } from "../functions";

const product_table_body = mustGet<HTMLTableSectionElement>("#invn_table tbody");
const text_input = mustGet<HTMLInputElement>("#search_text");
const clear_button = mustGet<HTMLButtonElement>(".clear");
const batch_window = mustGet<HTMLDivElement>(".batch_window");
const batch_tbody = mustGet<HTMLTableSectionElement>("#batch_table tbody");
const overlay = mustGet<HTMLDivElement>(".overlay");


/**
 *  Load the data table.
 *  Take all of the rows from backend and render them in the frontend.
 *  @param text text that use to query in the database to narrow down the product.
 */
async function load_table(text:string) {
    const product_rows = await inventory_get_products(text);
    
    product_table_body.innerHTML = '';
    
    product_rows.forEach((product_row) => {
        const product_trow = product_table_body.insertRow()
        
        product_trow.insertCell().innerText = String(product_row.prod_id);
        product_trow.insertCell().innerText = product_row.prod_type === "gro" ? "Grocery" : "Medicine";
        product_trow.insertCell().innerText = product_row.name;
        product_trow.insertCell().innerText = product_row.generic_name ? product_row.generic_name : '-';
        product_trow.insertCell().innerText = product_row.company ? product_row.company : '-';
        product_trow.insertCell().innerText = product_row.form ? product_row.form : '-';
        product_trow.insertCell().innerText = product_row.strength ? product_row.strength : '-';
        product_trow.insertCell().innerText = product_row.stock;
        product_trow.insertCell().innerText = product_row.reorder_level;
        
        const cls = prodRowColorPicker(product_row);
        
        if (cls) {
            product_trow.classList.add(cls);   // Add to the class list to visually identify the state of the row.
            product_trow.title = LABELS[cls];  // Add a hint text
        }
        
        product_trow.addEventListener("click", async () => {
            batch_window.hidden = false;
            overlay.hidden = false;
            batch_tbody.innerHTML = '';
            
            const batch_rows = await inventory_get_batches(product_row.prod_id);
            
            batch_rows.forEach((batch_row) => {
                const batch_trow = batch_tbody.insertRow();
                
                batch_trow.insertCell().innerText = String(batch_row.batch_id);
                batch_trow.insertCell().innerText = batch_row.batch_number;
                batch_trow.insertCell().innerText = batch_row.unit_bought_price;
                batch_trow.insertCell().innerText = batch_row.unit_sell_price;
                batch_trow.insertCell().innerText = batch_row.expiry_date;
                batch_trow.insertCell().innerText = batch_row.current_stock;
                
                const cls = batchRowColorPicker(batch_row);
                if (cls) batch_trow.classList.add(cls);
            });
        });
    });
}

// logic for input. when typing it refresh the table with newest received data.
text_input.addEventListener("input",() => {
    clear_button.hidden = text_input.value === '';  // display the clear button.
    load_table(text_input.value)
});

load_table(""); // initial load.

// logic for clear button. when clicked the input get cleared.
clear_button.addEventListener("click", () => {
    text_input.value = '';
    clear_button.hidden = text_input.value === '';  // hide the clear button.
    load_table('');
    text_input.focus();
});

overlay.addEventListener("click", () => {
    batch_window.hidden = true;
    overlay.hidden = true;
})