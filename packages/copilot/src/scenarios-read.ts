import type { Order } from "@repo/contracts";
import type { CopilotResponse, Scenario, TableRow } from "./types";
import { DAY_MS, dataNow, fmtSAR } from "./engine-helpers";

/* Merchant read-only scenarios — answers computed from real mock data.
 * `test` regexes match the NORMALIZED input (ت→ه folds, no diacritics). */

const top5: Scenario = {
  id: "top5-products",
  test: /(افضل|الاكثر|اعلي|توب|top).*(مبيع|منتج)|منتجات.*(الاكثر مبيعا|الافضل)|اكثر \d+ منتج/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const products = await ctx.api.products.list();
    const top = [...products].sort((a, b) => b.stats.sold30d - a.stats.sold30d).slice(0, 5);
    const rows: TableRow[] = top.map((p, i) => ({
      rank: i + 1, product: p.name.ar, sold: p.stats.sold30d, revenue: fmtSAR(p.stats.revenue30d.amount), views: p.stats.views30d,
    }));
    return {
      kind: "table",
      title: "أفضل 5 منتجات مبيعاً (آخر 30 يوم)",
      columns: [
        { key: "rank", label: "#" },
        { key: "product", label: "المنتج" },
        { key: "sold", label: "المبيعات" },
        { key: "revenue", label: "الإيراد" },
        { key: "views", label: "المشاهدات" },
      ],
      rows,
      chart: {
        title: "الأكثر مبيعاً",
        chartType: "bar",
        series: top.map((p) => ({ label: p.name.ar, value: p.stats.sold30d })),
      },
    };
  },
};

const openOrders: Scenario = {
  id: "open-filtered-orders",
  test: /(افتح|اعرض|اظهر|ورني|روح|خذني|انتقل).*(طلب)|طلبات.*(تحتاج|معلقه|جديده|غير مكتمل|للتجهيز)/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const orders = await ctx.api.orders.list();
    const pending = orders.filter((o: Order) => o.status === "needs_action").length;
    const route = "/orders?status=needs_action";
    ctx.ui.navigate(route);
    return {
      kind: "result",
      summary: `فتحت صفحة الطلبات مفلترة على «يحتاج إجراء» — عندك ${pending} طلب بانتظار المعالجة.`,
      undoable: false,
      links: [{ label: "الطلبات المعلقة", href: route }],
    };
  },
};

const salesDrop: Scenario = {
  id: "sales-drop-analysis",
  test: /(انخف|تراجع|هبوط|نزول|قلة|ضعف).*(مبيع)|مبيعات.*(نزل|انخف|تراجع|قل|توقف)|ليش.*(مبيع|الدخل)/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const [analytics, orders, carts] = await Promise.all([
      ctx.api.analytics.home(), ctx.api.orders.list(), ctx.api.abandonedCarts.list(),
    ]);
    const anchor = dataNow(analytics.salesSeries.map((s) => s.date));
    const week = 7 * DAY_MS;
    const win = (from: number, to: number) =>
      analytics.salesSeries.filter((s) => { const t = +new Date(s.date); return t > from && t <= to; });
    const now = win(anchor - week, anchor);
    const prev = win(anchor - 2 * week, anchor - week);
    const sum = (list: typeof now, k: "revenue" | "orders") => list.reduce((s, p) => s + p[k], 0);
    const delta = (a: number, b: number) => (b === 0 ? "—" : `${(((a - b) / b) * 100).toFixed(1)}%`);
    const waiting = carts.filter((c) => c.recoveryStatus === "not_contacted").length;
    const unfulfilled = orders.filter((o: Order) => o.fulfillmentStatus === "unfulfilled" && o.status !== "cancelled").length;
    return {
      kind: "text",
      text:
        `مبيعات آخر 7 أيام ${fmtSAR(sum(now, "revenue"))} مقابل ${fmtSAR(sum(prev, "revenue"))} في الأسبوع السابق ` +
        `(${delta(sum(now, "revenue"), sum(prev, "revenue"))}). أبرز المؤشرات: ${waiting} سلة متروكة بدون تواصل ` +
        `و${unfulfilled} طلب غير مُجهّز — أعد تفعيل حملات السلات وراجع سرعة التجهيز.`,
      table: {
        title: "مقارنة أسبوعية",
        columns: [
          { key: "metric", label: "المؤشر" },
          { key: "now", label: "آخر 7 أيام" },
          { key: "prev", label: "الأسبوع السابق" },
          { key: "delta", label: "التغير" },
        ],
        rows: [
          { metric: "الإيراد", now: fmtSAR(sum(now, "revenue")), prev: fmtSAR(sum(prev, "revenue")), delta: delta(sum(now, "revenue"), sum(prev, "revenue")) },
          { metric: "الطلبات", now: sum(now, "orders"), prev: sum(prev, "orders"), delta: delta(sum(now, "orders"), sum(prev, "orders")) },
        ],
      },
      links: [
        { label: "التقارير", href: "/reports" },
        { label: "السلات المتروكة", href: "/abandoned-carts" },
        { label: "الطلبات", href: "/orders" },
      ],
    };
  },
};

export const MERCHANT_READ_SCENARIOS: Scenario[] = [top5, openOrders, salesDrop];
