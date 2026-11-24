import type { Order, Shipment } from "@repo/contracts";

/** Translated field labels for the printable label (no user-facing literals here). */
export interface ShippingLabelStrings {
  order: string;
  to: string;
  cod: string;
  weight: string;
  tracking: string;
  label: string;
  packages: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const money = (m: { amount: number; currency: string } | null) =>
  m ? `${(m.amount / 100).toFixed(2)} ${m.currency}` : null;

/**
 * Opens a real print window with one 10×15cm label page per shipment and calls
 * window.print() — the actual print path a carrier PDF would take, minus the
 * external label API (mock-only; carrier integration is documented as BLOCKED).
 * Returns false when the popup was blocked.
 */
export function printShippingLabels(
  jobs: { order: Order; shipment: Shipment }[],
  t: ShippingLabelStrings,
  dir: "rtl" | "ltr",
): boolean {
  if (!jobs.length || typeof window === "undefined") return false;
  const win = window.open("", "_blank", "width=720,height=960");
  if (!win) return false;
  const pages = jobs
    .map(({ order, shipment: s }) => {
      const a = order.shippingAddress;
      const address = [a.city, a.district, a.street].filter(Boolean).join("، ");
      const grams = s.packages.reduce((sum, p) => sum + p.weightGrams, 0);
      const cod = money(s.codAmount);
      return `<section class="label">
  <header><strong>${esc(s.carrier)}</strong> · ${esc(s.service)}<br /><small>${esc(t.order)} #${order.number}</small></header>
  <p class="meta">${esc(t.tracking)} <bdi dir="ltr">${esc(s.trackingNumber ?? "—")}</bdi></p>
  ${s.labelNumber ? `<p class="meta">${esc(t.label)} <bdi dir="ltr">${esc(s.labelNumber)}</bdi></p>` : ""}
  <h2>${esc(t.to)}</h2>
  <p class="addr">${esc(a.recipientName)}<br />${esc(address)}<br /><bdi dir="ltr">${esc(a.phone)}</bdi></p>
  <footer>
    <span>${esc(t.packages)}: ${s.packages.length}</span>
    <span>${esc(t.weight)}: ${(grams / 1000).toFixed(2)} kg</span>
    ${cod ? `<span>${esc(t.cod)}: <bdi dir="ltr">${cod}</bdi></span>` : ""}
  </footer>
</section>`;
    })
    .join("");
  win.document.write(`<!doctype html><html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}"><head><meta charset="utf-8" />
<title>${esc(t.label)}</title>
<style>
@page { size: 100mm 150mm; margin: 8mm; }
* { box-sizing: border-box; }
body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin: 0; }
.label { page-break-after: always; border: 2px dashed #999; padding: 6mm; }
.label:last-child { page-break-after: auto; }
header { font-size: 4.5mm; } small { font-size: 3.2mm; }
.meta { margin: 3mm 0 0; font-size: 3.4mm; }
h2 { margin: 6mm 0 2mm; font-size: 4mm; }
.addr { margin: 0; font-size: 3.6mm; line-height: 1.7; }
footer { display: flex; justify-content: space-between; gap: 4mm; margin-top: 6mm; font-size: 3.4mm; }
</style></head><body>${pages}<script>window.addEventListener("load",function(){window.print()})</script></body></html>`);
  win.document.close();
  return true;
}
