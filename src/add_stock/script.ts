import Decimal from "decimal.js";
import { addBatchToDatabase, getIdForAddStock, inputFilter, mustGet, requireUser } from "../functions";
import { NewBatchDetails, StockProductSearch } from "../types";

await requireUser();  // Rediret back to login page. Prevent access by not logged in users.

const form = mustGet<HTMLFormElement>("#stock_form");
const searchWindow = mustGet<HTMLDivElement>("#search_window");
const overlay = mustGet<HTMLDivElement>("#overlay");
const searchTextBox = mustGet<HTMLInputElement>("#search_text");
const clearTextButton = mustGet<HTMLButtonElement>("#clear");
const tableBox = mustGet<HTMLDivElement>("#results_box");
const tableTBody = mustGet<HTMLTableSectionElement>("#results_body");
const idDisplay = mustGet<HTMLSpanElement>("#selected_id");
const nameDisplay = mustGet<HTMLSpanElement>("#selected_name");
const batchNumberInput = mustGet<HTMLInputElement>("#batch_number");
const quantityInput = mustGet<HTMLInputElement>("#quantity");
const expiryDateInput = mustGet<HTMLInputElement>("#expiry_date");
const boughtPriceInput = mustGet<HTMLInputElement>("#unit_bought_price");
const sellPriceInput = mustGet<HTMLInputElement>("#unit_sell_price");
const formMsgBar = mustGet<HTMLParagraphElement>("#form_msg");
const productBox = mustGet<HTMLDivElement>("#product_box");


let selectedProductId: number | null = null;
const today = new Date().toLocaleDateString();

mustGet<HTMLButtonElement>("#search_product").addEventListener("click", async () => {
    searchWindow.hidden = false;
    overlay.hidden = false;
    searchTextBox.focus();
});

searchTextBox.addEventListener("input", () => {
    clearTextButton.hidden = searchTextBox.value === '';
    tableBox.hidden = searchTextBox.value === '';
    loadData(searchTextBox.value);
});

async function loadData(text: string): Promise<void> {
    try {
        const products = await getIdForAddStock(text);
        tableTBody.innerHTML = '';
        products.forEach((prodRow) => {
            const prodTableRow = tableTBody.insertRow();
            tableRowBuilder(prodTableRow, prodRow);
            prodTableRow.addEventListener("click", () => {
                selectedProductId = prodRow.prod_id;
                idDisplay.innerText = String(prodRow.prod_id);
                nameDisplay.innerText = `${prodRow.name} ${prodRow.generic_name ? prodRow.generic_name : ''} ${prodRow.company ? prodRow.company : ''} ${prodRow.form ? prodRow.form : ''} ${prodRow.strength ? prodRow.strength : ''}`;
                productBox.classList.add("selected");
                closeSearchWindow();
                clearMessage();
            });
        });
    } catch (err) {
        alert(err)
    }
}

overlay.addEventListener("click", () => {
    closeSearchWindow();
});

form.addEventListener("input", clearMessage);

form.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    
    const error = validate();
    if (error) {
        showMessage(error, true);
        return;
    }
    
    const batchNumber = batchNumberInput.value.trim();
    mustGet<HTMLButtonElement>("#submit_stock").disabled = true;
    const batch: NewBatchDetails = {
        prod_id: selectedProductId!,
        batch_number: batchNumber,
        quantity: new Decimal(quantityInput.value).toFixed(4),
        unit_bought_price: new Decimal(boughtPriceInput.value).toFixed(2),
        unit_sell_price: new Decimal(sellPriceInput.value).toFixed(2),
        expiry_date: expiryDateInput.value
    }
    
    try {
        await addBatchToDatabase(batch);
        resetFrom();
        showMessage(`Batch ${batchNumber} added to ${nameDisplay.textContent}.`, false);
    } catch (err) {
        alert(err);
    } finally {
        mustGet<HTMLButtonElement>("#submit_stock").disabled = false;
    }
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && !searchWindow.hidden) closeSearchWindow();
});

function closeSearchWindow(): void {
    clearSearchWindow();
    searchWindow.hidden = true;
    overlay.hidden = true;
}

clearTextButton.addEventListener("click", clearSearchWindow);

function clearSearchWindow(): void {
    searchTextBox.value = '';
    clearTextButton.hidden = true;
    tableBox.hidden = true;
    tableTBody.innerHTML = '';
    searchTextBox.focus();
}

function tableRowBuilder(prodTableRow: HTMLTableRowElement, prodRow: StockProductSearch): void {
    prodTableRow.insertCell().innerText = String(prodRow.prod_id);
    prodTableRow.insertCell().innerText = prodRow.prod_type === "gro" ? "Grocery" : "Medicine";
    prodTableRow.insertCell().innerText = prodRow.name;
    prodTableRow.insertCell().innerText = prodRow.generic_name ? prodRow.generic_name : '-';
    prodTableRow.insertCell().innerText = prodRow.company ? prodRow.company : '-';
    prodTableRow.insertCell().innerText = prodRow.form ? prodRow.form : '-';
    prodTableRow.insertCell().innerText = prodRow.strength ? prodRow.strength : '-';
}

function validate(): string | null {
    if (selectedProductId === null) return "Select a Product first."
    if (batchNumberInput.value.trim() === '') return "Enter the batch number.";
    
    const quantity = toDecimal(boughtPriceInput.value);
    if (quantity === null || quantity.lte(0)) return "Quantity must be more that 0.";
    
    const bought = toDecimal(boughtPriceInput.value);
    if (bought === null || bought.lte(0)) return "Enter the unit bought price.";
    
    const sell = toDecimal(sellPriceInput.value);
    if (sell === null || sell.lte(0)) return "Enter the unit sell price.";
    if (sell.lt(bought)) return "Unit sell price is lower that the bought price.";
    
    if (expiryDateInput.value.trim() === '') return "Enter the expiry date.";
    if (!isValidDate(expiryDateInput.value)) return "Enter the expiry date as YYYY-MM-DD.";
    if (expiryDateInput.value.trim() < today) return "This batch has already expired.";
    
    return null
}

function toDecimal(value: string): Decimal | null {
    try {
        return new Decimal(value);
    } catch (err) {
        return null;
    }
}

function showMessage(text: string, isError: boolean): void {
    formMsgBar.textContent = text;
    formMsgBar.classList.toggle("error", isError);
    formMsgBar.hidden = false;
}

function clearMessage(): void {
    formMsgBar.hidden = true;
}

[quantityInput, boughtPriceInput, sellPriceInput].forEach((inp) => {
    inp.addEventListener("input", () => inputFilter(inp));
});

function resetFrom(): void {
    form.reset();
    selectedProductId = null;
    idDisplay.textContent = "ID";
    nameDisplay.textContent = "No product selected";
    productBox.classList.remove("selected");
}

expiryDateInput.addEventListener("input", () => {
    const digits = expiryDateInput.value.replace("/\D/g", '').slice(0, 10);
    expiryDateInput.value = digits
            .replace(/^(\d{4})(\d{1,2})/, "$1-$2")
            .replace(/^(\d{4}-\d{2})(\d{1,2})/, "$1-$2");
});

function isValidDate(value: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return false;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(y, mo - 1, d);
    return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
}