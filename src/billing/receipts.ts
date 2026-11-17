import jsPDF from "jspdf";
import { BillingOrder, BillingOrderInfo, DIMENSIONS, SHOP } from "../types";
import Decimal from "decimal.js";
import { BaseDirectory, mkdir, writeFile } from "@tauri-apps/plugin-fs";

export function makeReceipts(orderInfo: BillingOrderInfo, orderDetails: BillingOrder, paid: string, change: string): Uint8Array<ArrayBuffer> {
    const innerW = DIMENSIONS.W - 2 * DIMENSIONS.M;
    const probe = new jsPDF({ unit: "mm", format: [DIMENSIONS.W, 100] });
    probe.setFont("courier");
    probe.setFontSize(DIMENSIONS.FONT);
    const rows = orderDetails.items.map((item) => ({
        nameLines: probe.splitTextToSize(item.name, innerW) as string[],
        quantity: item.bought_quantity,
        price: item.unit_price
    }));
    
    const itemLines  = rows.reduce((n, r) => n + r.nameLines.length + 1, 0);
    const height = (16 + itemLines) * DIMENSIONS.LINE + 2* DIMENSIONS.M;
    
    const doc = new jsPDF({ unit: "mm", format: [DIMENSIONS.W, height] });
    doc.setFont("courier", "normal");
    doc.setFontSize(DIMENSIONS.FONT);
    let y = DIMENSIONS.M + 2;
    
    const center = (t: string, bold = false) => {
        doc.setFont("courier", bold ? "bold" : "normal");
        doc.text(t, DIMENSIONS.W / 2, y, { align: "center" });
        doc.setFont("courier", "normal");
        y += DIMENSIONS.LINE;
    };
    
    const leftRight = (l: string, r: string, bold = false) => {
        doc.setFont("courier", bold ? "bold" : "normal");
        doc.text(l, DIMENSIONS.M, y);
        doc.text(r, DIMENSIONS.W - DIMENSIONS.M, y, { align: "right" });
        doc.setFont("courier", "normal");
        y += DIMENSIONS.LINE;
    };
    
    const rule = () => {
        doc.line(DIMENSIONS.M, y - 1, DIMENSIONS.W - DIMENSIONS.M, y - 1);
        y += DIMENSIONS.LINE;
    };
    
    center(SHOP.name);
    center(SHOP.address);
    center(SHOP.phone);
    rule();
    leftRight("Bill #", String(orderInfo.order_id));
    leftRight(orderInfo.order_date, orderInfo.order_time);
    rule();
    
    for (const row of rows) {
        for (const line of row.nameLines) {
            doc.text(line, DIMENSIONS.M, y);
            y += DIMENSIONS.LINE;
        }
        leftRight(`${row.quantity} x ${row.price}`, Decimal(row.quantity).times(Decimal(row.price)).toFixed(2));
    }
    
    rule();
    leftRight("TOTAL", orderDetails.total_amount, true);
    leftRight("Payment", orderDetails.payment_method);
    leftRight("Paid", paid);
    leftRight("Change", change);
    rule();
    center("Thank you!");
    
    return new Uint8Array(doc.output("arraybuffer"));
}

export async function saveReceipt(bytes: Uint8Array, orderId: number): Promise<void> {
    await mkdir("receipts", { baseDir: BaseDirectory.Document, recursive: true });
    await writeFile(`receipts/receipt-${orderId}.pdf`, bytes, {baseDir: BaseDirectory.Document});
}