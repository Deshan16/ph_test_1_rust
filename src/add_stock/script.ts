import { getIdForAddStock, mustGet } from "../functions";

mustGet<HTMLButtonElement>("#search_product").addEventListener("click", async () => {

});


async function loadData(text: string) {
    const ids = await getIdForAddStock(text);
    
}