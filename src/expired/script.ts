import { generateExpiredList, mustGet, requireUser } from "../functions";

await requireUser();

const expiredTable = mustGet<HTMLTableSectionElement>("#expired_table tbody");
const emptyLabel = mustGet<HTMLParagraphElement>("#empty");
const input  = mustGet<HTMLInputElement>("#search_text");
const clearTextButton = mustGet<HTMLButtonElement>(".clear");

async function loadData(text: string) {
    expiredTable.innerHTML = "";
    const rows = await generateExpiredList(text);
    
    emptyLabel.hidden = true;
    expiredTable.hidden = false;
    
    if (rows.length === 0) {
        emptyLabel.hidden = false;
        expiredTable.hidden = true;
    }
    
    rows.forEach((row) => {
        const tableRow = expiredTable.insertRow()
        
        tableRow.insertCell().innerText = String(row.prod_id);
        tableRow.insertCell().innerText = row.prod_type === "gro" ? "Grocery" : "Medicine";
        tableRow.insertCell().innerText = row.name;
        tableRow.insertCell().innerText = row.generic_name ? row.generic_name : '-';
        tableRow.insertCell().innerText = row.company ? row.company : '-';
        tableRow.insertCell().innerText = String(row.batch_id);
        tableRow.insertCell().innerText = row.batch_number;
        tableRow.insertCell().innerText = row.expiry_date;
        tableRow.insertCell().innerText = row.current_stock;
    });
}

loadData('');

mustGet<HTMLButtonElement>("#refresh").addEventListener("click", async () => loadData(''));

input.addEventListener("input", async () => {
    clearTextButton.hidden = input.value === '';
    loadData(input.value);
});

clearTextButton.addEventListener("click", async () => {
    input.value = '';
    loadData('');
    clearTextButton.hidden = true;
});