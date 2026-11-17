import { getReorderItems, mustGet } from "../functions";

const reorderTable = mustGet<HTMLTableSectionElement>("#reorder_table tbody");

async function loadData() {
    const rows = await getReorderItems()
    rows.forEach((row) => {
        const tableRow = reorderTable.insertRow()
        
        tableRow.insertCell().innerText = String(row.prod_id);
        tableRow.insertCell().innerText = row.prod_type === "gro" ? "Grocery" : "Medicine";
        tableRow.insertCell().innerText = row.name;
        tableRow.insertCell().innerText = row.generic_name ? row.generic_name : '-';
        tableRow.insertCell().innerText = row.company ? row.company : '-';
        tableRow.insertCell().innerText = row.stock;
    });
}

loadData();