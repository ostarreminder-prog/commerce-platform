import type { CopilotResponse, DiffEntry, Scenario } from "./types";
import { registerAction } from "./executor";
import { fmtSAR, minVariantPrice, normalizeArabic } from "./engine-helpers";

/* Merchant scenarios that end in an action card — execution happens
 * later through executeAction() once the UI confirms. */

const priceUp: Scenario = {
  id: "price-up-category",
  test: /(زد|ارفع|زياده|رفع|غلي).*(سعر|اسعار|%|بالميه|بالمائه)|\+?\d+\s?(%|بالميه|بالمائه)/,
  run: async (input, ctx): Promise<CopilotResponse> => {
    const pct = Number(input.match(/(\d+)\s?(?:%|بالميه|بالمائه|في الميه)/)?.[1] ?? 10);
    const norm = normalizeArabic(input);
    const categories = await ctx.api.categories.list();
    const category =
      categories.find((c) => c.name.ar.split(/\s+/).some((w) => w.length > 2 && norm.includes(normalizeArabic(w)))) ??
      categories.find((c) => /عطر|بخور/.test(c.name.ar)) ??
      categories[0];
    if (!category) return { kind: "text", text: "ما لقيت أي تصنيف في المتجر." };
    const products = (await ctx.api.products.list()).filter((p) => p.categoryIds.includes(category.id));
    if (!products.length) return { kind: "text", text: `ما فيه منتجات تحت تصنيف «${category.name.ar}».` };
    const ids = products.map((p) => p.id);
    /* Snapshot the touched products so «تراجع» restores exact pre-run prices. */
    const snapshot = products.map((p) => structuredClone(p));
    const diff: DiffEntry[] = products.slice(0, 4).map((p) => {
      const price = minVariantPrice(p);
      return { field: p.name.ar, from: fmtSAR(price), to: fmtSAR(Math.round(price * (1 + pct / 100))) };
    });
    const actionId = registerAction({
      calls: [{ toolName: "products.adjustPrices", args: { ids, mode: "percent", value: pct } }],
      summary: `رفعت أسعار ${ids.length} منتج في «${category.name.ar}» بنسبة ${pct}%.`,
      undoable: true,
      undo: async (ctx) => {
        for (const p of snapshot) await ctx.api.products.save({ ...p });
      },
      links: [{ label: "المنتجات", href: `/products?category=${category.id}` }],
    });
    return {
      kind: "action",
      actionId,
      title: `رفع الأسعار ${pct}% — ${category.name.ar}`,
      description: `بتتعدل أسعار كل المتغيرات في ${ids.length} منتج. عينة قبل/بعد:`,
      affected: { count: ids.length, items: products.slice(0, 5).map((p) => p.name.ar) },
      diff,
      dangerLevel: "normal",
    };
  },
};

const addStaff: Scenario = {
  id: "add-staff",
  test: /(اضف|اضافه|دعوه|دعي|وجه).*(موظف|عضو|فريق)|موظف جديد/,
  run: async (input, ctx): Promise<CopilotResponse> => {
    const email = input.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
    if (!email) {
      return {
        kind: "clarify",
        question: "وش اسم الموظف وإيميله؟ اكتبها مثل: «أضف موظف سارة على sara@store.sa»",
        options: [
          { id: "open-staff", label: "افتح صفحة فريق العمل" },
          { id: "cancel", label: "إلغاء" },
        ],
      };
    }
    const afterWord = input.match(/(?:اسمه?|موظف|عضو)\s+([ء-ي\w]+)/)?.[1];
    const name = afterWord && !/^(على|عند|جديد|بريد|ايميل|إيميل)$/.test(afterWord) ? afterWord : email.split("@")[0] ?? "موظف جديد";
    const roles = await ctx.api.staff.roles();
    /* Least-privileged role that can handle conversations — support, not owner. */
    const role = roles.filter((r) => r.id !== "role_owner" && r.permissions.includes("conversations.reply")).sort((a, b) => a.permissions.length - b.permissions.length)[0] ?? roles.at(-1);
    if (!role) return { kind: "text", text: "ما فيه أدوار معرفة — أضف دوراً من إعدادات الفريق أولاً." };
    const actionId = registerAction({
      calls: [{ toolName: "staff.invite", args: { name, email, roleId: role.id } }],
      summary: `أرسلت دعوة لـ ${name} (${email}) بدور «${role.name}».`,
      undoable: false,
      links: [{ label: "فريق العمل", href: "/settings/team" }],
    });
    return {
      kind: "action",
      actionId,
      title: "دعوة موظف جديد",
      description: `دعوة ${name} على ${email} بدور «${role.name}» — توصله رسالة قبول.`,
      affected: { count: 1, items: [`${name} <${email}> — ${role.name}`] },
      dangerLevel: "normal",
    };
  },
};

const returnsAgent: Scenario = {
  id: "create-returns-agent",
  test: /(وكيل|بوت|عامل|مساعد).*(مرتجع|استرجاع|استبدال|returns)|مرتجعات.*(وكيل|مساعد|تلقائي)/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const agents = await ctx.api.agents.list();
    const orchestrator = agents.find((a) => a.parentId === null);
    const name = "وكيل المرتجعات والاستبدال";
    if (agents.some((a) => a.name === name)) return { kind: "text", text: "«وكيل المرتجعات والاستبدال» موجود مسبقاً في استوديو الوكلاء.", links: [{ label: "استوديو الوكلاء", href: "/agents" }] };
    const actionId = registerAction({
      calls: [{ toolName: "agents.create", args: { name, parentId: orchestrator?.id } }],
      summary: `أنشأت «${name}» كمسودة تحت «${orchestrator?.name ?? "الوكيل الرئيسي"}» — فعّله واكتب تعليماته من الاستوديو.`,
      undoable: false,
      links: [{ label: "استوديو الوكلاء", href: "/agents" }],
    });
    return {
      kind: "action",
      actionId,
      title: "إنشاء وكيل فرعي للمرتجعات",
      description: `وكيل متخصص يستقبل طلبات الاسترجاع والاستبدال من الوكيل الرئيسي — يُنشأ كمسودة تعدّلها قبل التفعيل.`,
      affected: { count: 1, items: [`${name} ← ${orchestrator?.name ?? "—"}`] },
      dangerLevel: "normal",
    };
  },
};

/* «خصم/استرداد على الطلب …» — files an approval request instead of mutating
 * the order directly: a pending card lands in /approvals and a human decides.
 * The request itself is the (reversible, pre-decision) action the card runs. */
const orderApproval: Scenario = {
  id: "request-order-approval",
  test: /(خصم|تخفيض|استرد|عوض|تعويض|رجع مبلغ|ارجاع مبلغ|كوبون).*(طلب|اوردر|order|#)|(طلب|اوردر).*(خصم|استرد|تعويض)/,
  run: async (input, ctx): Promise<CopilotResponse> => {
    const orders = await ctx.api.orders.list();
    const refMatch = input.match(/ord_\w+|#?\d{4,}/);
    const order = orders.find((o) => o.id === refMatch?.[0]?.replace("#", "") || String(o.number) === refMatch?.[0]?.replace("#", ""));
    if (!order) {
      return {
        kind: "clarify",
        question: "أي طلب تقصد؟ اكتب رقمه مثل: «خصم 20% على الطلب #10290» أو اذكر الطلب بـ #ord_",
        options: [
          { id: "open-orders", label: "افتح الطلبات" },
          { id: "cancel", label: "إلغاء" },
        ],
      };
    }
    const isRefund = /استرد|عوض|تعويض|رجع مبلغ|ارجاع مبلغ/.test(input);
    const action: "refund" | "discount_above_limit" = isRefund ? "refund" : "discount_above_limit";
    const pct = Number(input.match(/(\d+)\s?(?:%|بالميه|بالمائه|في الميه)/)?.[1] ?? 0);
    const sarAmount = Number(input.match(/(\d+(?:\.\d+)?)\s?(?:ريال|ر\.س|sar)/i)?.[1] ?? 0);
    const amountHalalas = isRefund
      ? (sarAmount > 0 ? Math.round(sarAmount * 100) : order.total.amount)
      : (pct > 0 ? Math.round(order.total.amount * pct / 100) : Math.round(sarAmount * 100));
    const customerName = await ctx.api.customers.get(order.customerId).then((c) => c.name).catch(() => null);
    const label = isRefund ? "استرداد" : `خصم${pct ? ` ${pct}%` : ""}`;
    const diff: DiffEntry[] = isRefund
      ? [{ field: "المبلغ المسترد", from: "0.00 ر.س", to: fmtSAR(amountHalalas) }]
      : [{ field: "إجمالي الطلب", from: fmtSAR(order.total.amount), to: fmtSAR(order.total.amount - amountHalalas) }];
    const reason = input.trim();
    const actionId = registerAction({
      calls: [
        {
          toolName: "approvals.request",
          args: { action, orderId: order.id, ...(amountHalalas > 0 ? { amount: amountHalalas } : {}), reason },
        },
      ],
      summary: `أرسلت طلب موافقة «${label}» على الطلب #${order.number} — بيظهر معلقاً في صفحة الموافقات لينفّذه المشرف.`,
      undoable: false,
      links: [
        { label: "الموافقات", href: "/approvals" },
        { label: "الطلب", href: `/orders/${order.id}` },
      ],
    });
    return {
      kind: "action",
      actionId,
      title: `طلب موافقة — ${label} على الطلب #${order.number}`,
      description: "حسب سياسة المتجر الإجراءات المالية تحتاج موافقة بشرية — بتنفيذ الطلب يُسجّل معلقاً في صفحة الموافقات وما يتنفذ إلا بعد قرار المشرف.",
      affected: { count: 1, items: [`#${order.number}${customerName ? ` · ${customerName}` : ""}`] },
      diff,
      dangerLevel: "normal",
    };
  },
};

const deleteArchived: Scenario = {
  id: "delete-archived-products",
  test: /(احذف|حذف|امسح|نظف).*(مورشف|ارشيف|archiv)|حذف منتجات/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const archived = (await ctx.api.products.list()).filter((p) => p.status === "archived");
    if (!archived.length) return { kind: "text", text: "ما فيه منتجات مؤرشفة — الكتالوج نظيف." };
    const actionId = registerAction({
      calls: [{ toolName: "products.deleteArchived", args: {} }],
      summary: `حذفت ${archived.length} منتج مؤرشف نهائياً.`,
      undoable: false,
      links: [{ label: "المنتجات", href: "/products?status=archived" }],
    });
    return {
      kind: "action",
      actionId,
      title: "حذف المنتجات المؤرشفة نهائياً",
      description: `بيُحذف ${archived.length} منتج من الكتالوج وكل مستويات مخزونها — ما يمكن التراجع.`,
      affected: { count: archived.length, items: archived.slice(0, 6).map((p) => p.name.ar) },
      dangerLevel: "dangerous",
      requiresTextConfirm: "حذف",
    };
  },
};

export const MERCHANT_ACTION_SCENARIOS: Scenario[] = [priceUp, addStaff, returnsAgent, orderApproval, deleteArchived];
