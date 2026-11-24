import type { Invoice, Store } from "@repo/contracts";

/** Translated strings for the generated invoice document — collected at call
 * time so the print window honors the active locale/direction. */
export interface InvoiceDocStrings {
  docTitle: string;
  taxInvoice: string;
  seller: string;
  billTo: string;
  vatNo: string;
  orderNo: string;
  issueDate: string;
  number: string;
  description: string;
  qty: string;
  unitPrice: string;
  vat: string;
  lineTotal: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  qrHint: string;
  relatedInvoice: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (m: { amount: number; currency: string }) => `${(m.amount / 100).toFixed(2)} ${m.currency}`;

/** Renders the invoice as a self-contained, print-ready HTML document — the
 * real artifact a PDF service would produce; in the mock the browser's
 * print-to-PDF is the honest export path. */
export function invoiceDocHtml(
  inv: Invoice,
  store: Store | null,
  t: InvoiceDocStrings,
  locale: "ar" | "en",
): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const title = inv.type === "credit_note" ? t.docTitle : t.taxInvoice;
  const rows = inv.lines
    .map(
      (l) => `<tr>
  <td>${esc(l.description)}</td>
  <td class="num">${l.quantity}</td>
  <td class="num">${money(l.unitPrice)}</td>
  <td class="num">${money(l.vat)}</td>
  <td class="num">${money(l.total)}</td>
</tr>`,
    )
    .join("");
  const sellerVat = store?.vatNumber ? `<p>${esc(t.vatNo)}: <bdi dir="ltr">${esc(store.vatNumber)}</bdi></p>` : "";
  const buyerVat = inv.customer.vatNumber ? `<p>${esc(t.vatNo)}: <bdi dir="ltr">${esc(inv.customer.vatNumber)}</bdi></p>` : "";
  const related = inv.relatedInvoiceId
    ? `<p class="muted">${esc(t.relatedInvoice)}: ${esc(inv.relatedInvoiceId)}</p>`
    : "";
  return `<!doctype html><html dir="${dir}" lang="${locale}"><head><meta charset="utf-8" />
<title>${esc(inv.number)}</title>
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #111; margin: 0; font-size: 3.6mm; }
header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 4mm; margin-bottom: 6mm; }
h1 { margin: 0; font-size: 6mm; }
.muted { color: #555; }
.meta { text-align: ${dir === "rtl" ? "left" : "right"}; }
.meta p { margin: 1mm 0; }
.parties { display: flex; justify-content: space-between; gap: 8mm; margin-bottom: 6mm; }
.parties h2 { font-size: 3.8mm; margin: 0 0 2mm; }
.parties p { margin: 0.8mm 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
th, td { border-bottom: 1px solid #ccc; padding: 2mm; text-align: start; }
th { background: #f3f3f3; }
.num { font-variant-numeric: tabular-nums; text-align: ${dir === "rtl" ? "left" : "right"}; }
.totals { display: flex; justify-content: flex-end; }
.totals dl { min-width: 70mm; }
.totals div { display: flex; justify-content: space-between; padding: 1.4mm 0; }
.totals .grand { font-size: 4.4mm; font-weight: 700; border-top: 2px solid #111; margin-top: 2mm; padding-top: 2mm; }
footer { margin-top: 8mm; display: flex; justify-content: space-between; align-items: flex-end; gap: 8mm; }
.qr { width: 30mm; height: 30mm; border: 1px solid #999; display: flex; align-items: center; justify-content: center; font-size: 2.6mm; color: #666; text-align: center; padding: 2mm; word-break: break-all; }
</style></head><body>
<header>
  <div>
    <h1>${esc(title)}</h1>
    ${related}
  </div>
  <div class="meta">
    <p><strong>${esc(t.number)}:</strong> <bdi dir="ltr">${esc(inv.number)}</bdi></p>
    <p>${esc(t.issueDate)}: <bdi dir="ltr">${esc(inv.issuedAt.slice(0, 10))}</bdi></p>
    <p>${esc(t.orderNo)}: #${esc(inv.orderId.replace(/\D/g, "") || inv.orderId)}</p>
  </div>
</header>
<div class="parties">
  <section>
    <h2>${esc(t.seller)}</h2>
    <p><strong>${esc(store ? store.name[locale] ?? store.name.ar : "")}</strong></p>
    ${store?.legalName ? `<p class="muted">${esc(store.legalName)}</p>` : ""}
    ${sellerVat}
  </section>
  <section>
    <h2>${esc(t.billTo)}</h2>
    <p><strong>${esc(inv.customer.name)}</strong></p>
    ${buyerVat}
  </section>
</div>
<table>
  <thead><tr>
    <th>${esc(t.description)}</th><th class="num">${esc(t.qty)}</th><th class="num">${esc(t.unitPrice)}</th><th class="num">${esc(t.vat)}</th><th class="num">${esc(t.lineTotal)}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals"><dl>
  <div><dt>${esc(t.subtotal)}</dt><dd class="num">${money(inv.subtotal)}</dd></div>
  <div><dt>${esc(t.vatAmount)}</dt><dd class="num">${money(inv.vatAmount)}</dd></div>
  <div class="grand"><dt>${esc(t.total)}</dt><dd class="num">${money(inv.total)}</dd></div>
</dl></div>
<footer>
  <p class="muted">${esc(t.qrHint)}</p>
  <div class="qr">${esc(inv.qrCode || "—")}</div>
</footer>
<script>window.addEventListener("load",function(){window.print()})</script>
</body></html>`;
}

/** Opens the generated invoice in a print window (browser → real PDF possible).
 * Returns false when the popup was blocked. */
export function printInvoiceDoc(inv: Invoice, store: Store | null, t: InvoiceDocStrings, locale: "ar" | "en"): boolean {
  if (typeof window === "undefined") return false;
  const win = window.open("", "_blank", "width=840,height=1120");
  if (!win) return false;
  win.document.write(invoiceDocHtml(inv, store, t, locale));
  win.document.close();
  return true;
}

/** Downloads the same generated document as a .html file — an honest artifact
 * (the file the print window renders), not a fake PDF. */
export function downloadInvoiceDoc(inv: Invoice, store: Store | null, t: InvoiceDocStrings, locale: "ar" | "en") {
  const blob = new Blob([invoiceDocHtml(inv, store, t, locale)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${inv.number}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
