import { inventory_get_products } from "../invokes";

const table_body = document.querySelector<HTMLTableSectionElement>("#invn_table");
if (!table_body) throw new Error("tbody Element in #invn_table is not found");

const rows = await inventory_get_products("");
rows.forEach((row) => {
    const table_row = table_body.insertRow()
    table_row.insertCell().innerText = String(row.prod_id);
    table_row.insertCell().innerText = row.prod_type === "gro" ? "Grocery" : "Medicine";
    table_row.insertCell().innerText = row.name;
    table_row.insertCell().innerText = row.generic_name ? row.generic_name : '-';
    table_row.insertCell().innerText = row.company ? row.company : '-';
    table_row.insertCell().innerText = row.strength ? row.strength : '-';
    table_row.insertCell().innerText = row.form ? row.form : '-';
    table_row.insertCell().innerText = row.stock;
    table_row.insertCell().innerText = row.reorder_level;
});

