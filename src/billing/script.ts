import { BillingBatchRow, BillingOrder, BillingOrderItem, BillingProductRow, LABELS } from "../types";
import { batchRowColorPicker, billingGetBatches, billingGetProducts, billingUpdateDatabase, inputFilter, mustGet, openWindow, prodRowColorPicker } from "../functions";
import Decimal from "decimal.js";
import { makeReceipts, saveReceipt } from "./receipts";



const searchWindow = mustGet<HTMLDivElement>(".search_window");
const overlay = mustGet<HTMLDivElement>(".overlay");
const productSearchBar = mustGet<HTMLDivElement>("#search_text");
const productTableBox = mustGet<HTMLDivElement>(".search_table_box");
const prodTable = mustGet<HTMLTableSectionElement>(".search_table tbody");
const clearButton = mustGet<HTMLButtonElement>("#clear");
const searchText = mustGet<HTMLInputElement>("#search_text");
const batchTableBox = mustGet<HTMLDivElement>(".search_batch_results");
const batchTable = mustGet<HTMLTableSectionElement>("#batch_table tbody");
const billingTable = mustGet<HTMLTableSectionElement>("#billing_table tbody");
const checkoutButton = mustGet<HTMLButtonElement>("#checkout");
const cancelButton = mustGet<HTMLButtonElement>("#cancel_order");
const itemRowOptionMenu = mustGet<HTMLDivElement>("#row_menu");
const cancelPopUpBox = mustGet<HTMLDivElement>("#cancel_confirm");
const checkoutWindow = mustGet<HTMLDivElement>(".checkout_window");
const checkoutWindowAmountInput = mustGet<HTMLInputElement>("#amount_paid");
const grandTotalField = mustGet<HTMLSpanElement>("#grand_total");
const checkoutWindowNextCustomerButton = mustGet<HTMLButtonElement>("#next_customer");
const checkoutWindowItemCount = mustGet<HTMLSpanElement>("#checkout_items");
const checkoutWindowTotal = mustGet<HTMLSpanElement>("#checkout_total");
const checkoutWindowPaymentMethod = mustGet<HTMLSelectElement>("#payment_method");
const checkoutWindowChangeLabel = mustGet<HTMLSpanElement>("#change_amount");
const drawer = mustGet<HTMLElement>("#drawer");


/**
 *  Current active( just clicked ) row in the billing table.
 */
let activeBillingRow: HTMLTableRowElement | null = null;

/**
 *  Cart Object.
 */
const cart = {
    items: [] as BillingOrderItem[],
    /**
     *  Trigger when the cart is changed.
     */
    onChange: () => {},
    
    /**
     *  Insert Products to the cart.
     * @param item Item that need to insert in to the cart
     */
    add(item: BillingOrderItem): void {
        this.items.push(item);
        this.onChange();
    },
    
    /**
     *  Clear the cart.
     */
    clear(): void {
        this.items = [];
        this.onChange();
    },
    
    /**
     *  Remove an item from the cart.
     * @param batch_id id of the item that need to remove.
     */
    remove(batch_id: number): void {
        this.items = this.items.filter((item) => item.batch_id !== batch_id)
        this.onChange();
    },
    
    /**
     *  Update quantity of an item.
     * @param batch_id id of the item that need to change the quantity.
     * @param quantity new quantity.
     */
    updateQuantity(batch_id: number, quantity: string): void {
        const item = this.items.find((item) => item.batch_id === batch_id);
        if (!item) return;
        item.bought_quantity = quantity;
        this.onChange();
    }
}

cart.onChange = (): void => {
    checkoutButton.disabled = cart.items.length === 0;
    cancelButton.disabled = cart.items.length === 0;
}

mustGet<HTMLTableRowElement>(".add_row").addEventListener("click", () => {
    searchWindow.hidden = false;
    overlay.classList.add("active");
    productSearchBar.focus();
});

searchWindow.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") closeSearchWindow();
});

productSearchBar.addEventListener("input", () => {
    productTableBox.hidden = searchText.value === '';
    clearButton.hidden = searchText.value === '';
    loadSearchData(searchText.value);
});

/**
 *  Load the products, batches to the UI to add to the bill.
 * @param text text that use to search and narrow down the product.
 */
async function loadSearchData(text: string): Promise<void> {
    try {
        const searchProdRows = await billingGetProducts(text);
        prodTable.innerHTML = "";
        searchProdRows.forEach((prodRow) => {
            const prodTableRow = prodTable.insertRow();
            prodRowBuilder(prodTableRow, prodRow);
            prodTableRow.addEventListener("click", async () => {
                batchTableBox.hidden = false;
                batchTable.innerHTML = "";
                const searchBatchRows = await billingGetBatches(prodRow.prod_id);
                searchBatchRows.forEach((batchRow) => {
                    const batchTableRow = batchTable.insertRow();
                    batchRowBuilder(batchTableRow, batchRow);
                    batchTableRow.addEventListener("click", () => {
                        closeSearchWindow();
                        const billTableRow = billingTable.insertRow();
                        billingRowBuilder(billTableRow, prodRow, batchRow);
                    });
                });
            });
        });
    } catch (err) {
        alert(err);
    }
}

/**
 *  Build the search box's product table's rows.
 * @param prodTableRow table row that insert cells.
 * @param prodRow obj that holds data.
 */
function prodRowBuilder(prodTableRow: HTMLTableRowElement, prodRow: BillingProductRow): void {
    prodTableRow.insertCell().innerText = String(prodRow.prod_id);
    prodTableRow.insertCell().innerText = prodRow.prod_type === "gro" ? "Grocery" : "Medicine";
    prodTableRow.insertCell().innerText = prodRow.name;
    prodTableRow.insertCell().innerText = prodRow.generic_name ? prodRow.generic_name : '-';
    prodTableRow.insertCell().innerText = prodRow.company ? prodRow.company : '-';
    prodTableRow.insertCell().innerText = prodRow.form ? prodRow.form : '-';
    prodTableRow.insertCell().innerText = prodRow.strength ? prodRow.strength : '-';
    
    const cls = prodRowColorPicker(prodRow);
    if (cls) {
        prodTableRow.classList.add(cls);
        prodTableRow.title = LABELS[cls];
    }
}

/**
 *  Build the search box's batch tables's rows.
 * @param batchTableRow table row that insert cells.
 * @param batchRow object that hold the data needed.
 */
function batchRowBuilder(batchTableRow: HTMLTableRowElement, batchRow: BillingBatchRow): void {
    batchTableRow.insertCell().innerText = String(batchRow.batch_id);
    batchTableRow.insertCell().innerText = batchRow.batch_number;
    batchTableRow.insertCell().innerText = batchRow.unit_sell_price;
    batchTableRow.insertCell().innerText = batchRow.expiry_date;
    const remainingCell = batchTableRow.insertCell();
    remainingCell.innerText = String(batchRow.remaining);
    batchTableRow.insertCell().innerText = batchRow.current_stock;
    
    const cls = batchRowColorPicker(batchRow);
    if (cls) {
        batchTableRow.classList.add(cls);
        batchTable.title = LABELS[cls];
        remainingCell.classList.add("danger");
    }
}

function billingRowBuilder(billTableRow: HTMLTableRowElement, prodRow: BillingProductRow, batchRow: BillingBatchRow): void {
    billTableRow.insertCell().innerText = String(prodRow.prod_id);
    billTableRow.insertCell().innerText = prodRow.prod_type === "gro" ? "Grocery" : "Medicine";
    
    const nameCell = billTableRow.insertCell();
    nameCell.innerText = prodRow.name;
    nameCell.title = `${prodRow.name} ${prodRow.generic_name} ${prodRow.company} ${prodRow.strength}`;
    
    billTableRow.insertCell().innerText = batchRow.unit_sell_price;
    
    const input = quantityInputBuilder();
    billTableRow.insertCell().appendChild(input);
    input.focus();
    input.select();
    
    const totalCell = billTableRow.insertCell();
    
    cart.add({ batch_id: batchRow.batch_id, 
        bought_quantity: input.value, 
        name: `${prodRow.name} ${prodRow.generic_name} ${prodRow.company}`,
        unit_price: batchRow.unit_sell_price
    });
    
    input.addEventListener("blur", () => {
        const parsedValue = parseFloat(input.value);
        if (isNaN(parsedValue) || parsedValue <= 0.0 || input.value.trim() === '') input.value = '1';
        
        const quantity = input.value;
        totalCell.innerText = String(Decimal(quantity).times(Decimal(batchRow.unit_sell_price)).toFixed(2));
        input.disabled = true;
        cart.updateQuantity(batchRow.batch_id, input.value);
    });
    
    billTableRow.insertCell().appendChild(billingOptionButton());
    billTableRow.setAttribute("data-id", String(batchRow.batch_id));
}

/**
 *  Build the textfield that enter the quantity of each product.
 * @returns HTMLInputElement
 */
function quantityInputBuilder() {
    const input = document.createElement("input");
    input.type = "text";
    input.value = '1';
    input.addEventListener("input", () => inputFilter(input));
    
    input.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") input.blur();
    });
    
    return input;
}

function billingOptionButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.classList.add("row_menu_btn");
    button.type = "button";
    button.innerHTML = "&#8943;";
    button.setAttribute("aria-label", "Item options");
    
    button.addEventListener("click", (event: PointerEvent) => {
        event.stopPropagation();
        activeBillingRow = button.closest("tr");
        
        const rect = button.getBoundingClientRect();
        
        itemRowOptionMenu.hidden = false;
        itemRowOptionMenu.style.top = `${rect.bottom + 4}px`;
        itemRowOptionMenu.style.left = `${rect.right - itemRowOptionMenu.offsetWidth}px`
    });
    return button;
}

itemRowOptionMenu.addEventListener("click", (event: PointerEvent) => {
    const item = (event.target as HTMLElement).closest<HTMLButtonElement>(".row_menu_item");
    if (!activeBillingRow || !item) return;
    
    switch (item.getAttribute("data-action")) {
        case "remove":
            const batch_id = activeBillingRow.getAttribute("data-id");
            if (batch_id) {
                cart.remove(parseInt(batch_id));
                activeBillingRow.remove();
                activeBillingRow = null;
            }
            break;
        
        case "edit":
            const input = activeBillingRow.cells[4].querySelector<HTMLInputElement>("input");
            if (input) {
                input.disabled = false;
                input.focus();
                input.select();
            }
            break;
    }
    
    itemRowOptionMenu.hidden = true;
})

clearButton.addEventListener("click", clearSearchWindow);

/**
 * Clear search results from the search box.
 */
function clearSearchWindow(): void {
    searchText.value = '';
    productTableBox.hidden = true;
    clearButton.hidden = true;
    batchTableBox.hidden = true;
}

/**
 * Close the search box.
 */
function closeSearchWindow(): void {
    searchWindow.hidden = true;
    clearSearchWindow();
    overlay.classList.remove("active");
}

overlay.addEventListener("click", () => {
    if (!searchWindow.hidden) closeSearchWindow();
    if (!cancelPopUpBox.hidden) closeCancelOrderPopUp();
    toggleDrawer(false);
});

new MutationObserver(calculateTotal).observe(billingTable, {
    childList: true,
    subtree: true,
    characterData: true,
});

/**
 * Calculate the total of the bill.
 */
function calculateTotal(): void {
    let total = Decimal('0');
    document.querySelectorAll<HTMLTableRowElement>("#billing_table tbody tr").forEach((row) => {
        total = total.add(Decimal(String(row.cells[5].textContent)));
    });
    grandTotalField.textContent = total.toFixed(2);
}

document.addEventListener("click", () => {
    itemRowOptionMenu.hidden = true;
});

mustGet<HTMLButtonElement>("#cancel_order").addEventListener("click", () => {
    cancelPopUpBox.hidden = false;
    overlay.classList.add("active");
});

mustGet<HTMLButtonElement>("#confirm_yes").addEventListener("click", () => {
    cart.clear();
    billingTable.innerHTML = '';
    closeCancelOrderPopUp();
});

mustGet<HTMLButtonElement>("#confirm_no").addEventListener("click", closeCancelOrderPopUp);

function closeCancelOrderPopUp(): void {
    cancelPopUpBox.hidden = true;
    overlay.classList.remove("active");
}

checkoutButton.addEventListener("click", () => {
    checkoutWindow.hidden = false;
    checkoutWindowNextCustomerButton.disabled = true;
    overlay.classList.add("active");
    checkoutWindowItemCount.innerText = String(cart.items.length);
    checkoutWindowTotal.innerText = grandTotalField.textContent;
});

mustGet<HTMLButtonElement>("#cancel_checkout").addEventListener("click", () => {
    billingTable.innerHTML = '';
    cart.clear();
    closeCheckoutWindow();
});

mustGet<HTMLButtonElement>("#checkout_close").addEventListener("click", closeCheckoutWindow);

function closeCheckoutWindow(): void {
    checkoutWindowAmountInput.value = '';
    checkoutWindowChangeLabel.innerHTML = '0.00';
    checkoutWindow.hidden = true;
    checkoutWindowPaymentMethod.value = "card";
    checkoutWindowAmountInput.disabled = false;
    overlay.classList.remove("active");
}

mustGet<HTMLButtonElement>("#next_customer").addEventListener("click", async () => {
    try {
        const total = grandTotalField.textContent;
        const method = checkoutWindowPaymentMethod.value
        const status = "completed";
        const paid = checkoutWindowAmountInput.value;
        const change = checkoutWindowChangeLabel.textContent;
        
        const order: BillingOrder = {
            total_amount: total,
            payment_method: method,
            status: status,
            items: cart.items
        }
        
        const orderInfo = await billingUpdateDatabase(order);
        
        const bytes = makeReceipts(orderInfo, order, paid, change);
        await saveReceipt(bytes, orderInfo.order_id);
        
        closeCheckoutWindow();
        cart.clear();
        billingTable.innerHTML = '';
    } catch (err) {
        alert(err);
    }
});

checkoutWindowAmountInput.addEventListener("input", () => inputFilter(checkoutWindowAmountInput));

checkoutWindowAmountInput.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        const paid = Decimal(checkoutWindowAmountInput.value);
        const total = Decimal(grandTotalField.textContent);
        const change = paid.minus(total);
        if (change.isNeg()) {
            checkoutWindowChangeLabel.innerText = "Error";
            checkoutWindowAmountInput.select();
            checkoutWindowNextCustomerButton.disabled = true;
            return
        }
        checkoutWindowChangeLabel.innerText = change.toFixed(2);
        checkoutWindowAmountInput.blur();
        checkoutWindowNextCustomerButton.disabled = false;
    }
});

checkoutWindowPaymentMethod.addEventListener("change", () => {
    const isCard = checkoutWindowPaymentMethod.value === "card";
    checkoutWindowAmountInput.disabled = isCard;
    if (isCard) {
        checkoutWindowAmountInput.value = '';
        checkoutWindowChangeLabel.innerText = "0.00";
    }
});

mustGet<HTMLButtonElement>("#menu_btn").addEventListener("click", () => toggleDrawer(true));
mustGet<HTMLButtonElement>("#drawer_close").addEventListener("click", () => toggleDrawer(false));

function toggleDrawer(open: boolean) {
    drawer.classList.toggle("open", open);
    overlay.classList.toggle("active", open);
    drawer.setAttribute("aria-hidden", String(!open));
}

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        toggleDrawer(false);
        if (!searchWindow.hidden) closeSearchWindow();
        if (!cancelPopUpBox.hidden) closeCancelOrderPopUp();
    }
});

drawer.querySelectorAll<HTMLButtonElement>(".drawer_item").forEach((btn) => {
    btn.addEventListener("click", () => {
        void openWindow(btn.getAttribute("data-label")!, btn.getAttribute("data-url")!, btn.getAttribute("data-title")!);
        toggleDrawer(false);
    });
});