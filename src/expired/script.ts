import { getExpiredStock, mustGet } from "../functions";

const reorderTable = mustGet<HTMLTableSectionElement>("#reorder_table tbody");
const emptyLabel = mustGet<HTMLParagraphElement>("#empty");

async function loadData() {
    reorderTable.innerHTML = "";
    const rows = await getExpiredStock()
    
    emptyLabel.hidden = true;
    reorderTable.hidden = false;
    
    if (rows.length === 0) {
        emptyLabel.hidden = false;
        reorderTable.hidden = true;
    }
    
    rows.forEach((row) => {
        const tableRow = reorderTable.insertRow()
        
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

loadData();

mustGet<HTMLButtonElement>("#refresh").addEventListener("click", async () => loadData());