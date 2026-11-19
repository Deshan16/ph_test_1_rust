import { InventoryBatchRow, InventoryProductRow, LABELS } from "../types";
import { batchRowColorPicker, inputFilter, inventoryGetBatches, inventoryGetProducts, inventoryUpdateExpiryWarning, inventoryUpdateReorderLevel, mustGet, prodRowColorPicker } from "../functions";

const productTableBody = mustGet<HTMLTableSectionElement>("#invn_table tbody");
const textInput = mustGet<HTMLInputElement>("#search_text");
const clearButton = mustGet<HTMLButtonElement>(".clear");
const batchWindow = mustGet<HTMLDivElement>(".batch_window");
const batchTbody = mustGet<HTMLTableSectionElement>("#batch_table tbody");
const overlay = mustGet<HTMLDivElement>(".overlay");
const itemRowOptionMenu = mustGet<HTMLDivElement>("#row_menu");

let activeInventoryRow: HTMLTableRowElement | null;

/**
 *  Load the data table.
 *  Take all of the rows from backend and render them in the frontend.
 *  @param text text that use to query in the database to narrow down the product.
 */
async function loadData(text:string) {
    const product_rows = await inventoryGetProducts(text);
    
    productTableBody.innerHTML = '';
    
    product_rows.forEach((prodRow) => {
        const invTableRow = productTableBody.insertRow()
        inventoryRowBuilder(invTableRow, prodRow);
        
        invTableRow.addEventListener("dblclick", async () => {
            batchWindow.hidden = false;
            overlay.hidden = false;
            batchTbody.innerHTML = '';
            
            const batch_rows = await inventoryGetBatches(prodRow.prod_id);
            
            batch_rows.forEach((batchRow) => {
                const batchTableRow = batchTbody.insertRow();
                inventoryBatchRowBuilder(batchTableRow, batchRow)
            });
        });
    });
}

// logic for input. when typing it refresh the table with newest received data.
textInput.addEventListener("input",() => {
    clearButton.hidden = textInput.value === '';  // display the clear button.
    loadData(textInput.value)
});

loadData(""); // initial load.

// logic for clear button. when clicked the input get cleared.
clearButton.addEventListener("click", () => {
    textInput.value = '';
    clearButton.hidden = textInput.value === '';  // hide the clear button.
    loadData('');
    textInput.focus();
});

overlay.addEventListener("click", () => {
    batchWindow.hidden = true;
    overlay.hidden = true;
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        batchWindow.hidden = true;
        overlay.hidden = true;
    }
});

function inventoryRowBuilder(invTableRow: HTMLTableRowElement, prodRow: InventoryProductRow) {
    invTableRow.insertCell().innerText = String(prodRow.prod_id);
    invTableRow.insertCell().innerText = prodRow.prod_type === "gro" ? "Grocery" : "Medicine";
    invTableRow.insertCell().innerText = prodRow.name;
    invTableRow.insertCell().innerText = prodRow.generic_name ? prodRow.generic_name : '-';
    invTableRow.insertCell().innerText = prodRow.company ? prodRow.company : '-';
    invTableRow.insertCell().innerText = prodRow.form ? prodRow.form : '-';
    invTableRow.insertCell().innerText = prodRow.strength ? prodRow.strength : '-';
    invTableRow.insertCell().innerText = prodRow.stock;
    
    const input1 = inventoryReorderLevelInput(prodRow.reorder_level);
    input1.addEventListener("blur", () => {
        inventoryUpdateReorderLevel(prodRow.prod_id, parseInt(input1.value));
    });
    invTableRow.insertCell().appendChild(input1);
    
    const input2 = inventoryExpiryWarningInput(String(prodRow.expiry_warning_days))
    input2.addEventListener("blur", () => {
        inventoryUpdateExpiryWarning(prodRow.prod_id, prodRow.expiry_warning_days);
    });
    invTableRow.insertCell().appendChild(input2);
    
    invTableRow.insertCell().appendChild(inventoryOptionButton())
    
    const cls = prodRowColorPicker(prodRow);
    
    if (cls) {
        invTableRow.classList.add(cls);   // Add to the class list to visually identify the state of the row.
        invTableRow.title = LABELS[cls];  // Add a hint text
    }
    
    invTableRow.setAttribute("data-id", String(prodRow.prod_id));
}

function inventoryBatchRowBuilder(batchTableRow: HTMLTableRowElement, batchRow: InventoryBatchRow): void {
    batchTableRow.insertCell().innerText = String(batchRow.batch_id);
    batchTableRow.insertCell().innerText = batchRow.batch_number;
    batchTableRow.insertCell().innerText = batchRow.unit_bought_price;
    batchTableRow.insertCell().innerText = batchRow.unit_sell_price;
    batchTableRow.insertCell().innerText = batchRow.expiry_date;
    batchTableRow.insertCell().innerText = batchRow.current_stock;
    
    const cls = batchRowColorPicker(batchRow);
    if (cls) batchTableRow.classList.add(cls);
}

function inventoryOptionButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.classList.add("row_menu_btn");
    button.type = "button";
    button.innerHTML = "&#8943;";
    button.setAttribute("aria-label", "Item options");
    
    button.addEventListener("click", (event: PointerEvent) => {
        event.stopPropagation();
        activeInventoryRow = button.closest("tr");
        
        const rect = button.getBoundingClientRect();
        
        itemRowOptionMenu.hidden = false;
        itemRowOptionMenu.style.top = `${rect.bottom + 4}px`;
        itemRowOptionMenu.style.left = `${rect.right - itemRowOptionMenu.offsetWidth}px`
    });
    return button;
}

document.addEventListener("click", () => {
    itemRowOptionMenu.hidden = true;
});

function inventoryReorderLevelInput(value: string) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.disabled = true;
    
    input.addEventListener("input", () => inputFilter(input));
    
    input.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") input.blur();
    });
    
    return input;
}

function inventoryExpiryWarningInput(value: string) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.disabled = true;
    
    input.addEventListener("input", () => {
        let cleaned = input.value.replace(/[^0-9]/g, '');
        input.value = cleaned;
    });
    
    input.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") input.blur();
    });
    
    return input;
}

itemRowOptionMenu.addEventListener("click", (event: PointerEvent) => {
    const item = (event.target as HTMLElement).closest<HTMLButtonElement>(".row_menu_item");
    if (!activeInventoryRow || !item) return;
    
    switch (item.getAttribute("data-action")) {
        case "enable_reorder":
            const inp1 = activeInventoryRow.cells[8].querySelector("input");
            if (inp1) {
                inp1.disabled = false;
                inp1.focus()
            }
            break;
            
            case "enable_expiry":
                const inp2 = activeInventoryRow.cells[9].querySelector("input");
                if (inp2) {
                    inp2.disabled = false;
                    inp2.focus()
                }
            break;
    }
});