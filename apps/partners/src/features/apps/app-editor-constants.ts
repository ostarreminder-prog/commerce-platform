import type { PartnerApp } from "@repo/contracts";

export const CATEGORIES: PartnerApp["category"][] = ["payments", "shipping", "marketing", "accounting", "ai"];
export const RESOURCES = ["orders", "products", "customers", "invoices", "shipments"] as const;
export const EVENTS = ["order.created", "order.paid", "order.shipped", "order.cancelled", "product.updated", "app.uninstalled"];

export const blank = (): PartnerApp => ({
  id: `app_${Date.now().toString(36)}`,
  name: { ar: "", en: "" },
  tagline: { ar: "", en: "" },
  category: "marketing",
  status: "draft",
  installs: 0,
  rating: 0,
  revenue: 0,
  monthlyPrice: 0,
  scopes: ["orders:read"],
  webhookUrl: "",
  redirectUrl: "",
  clientId: `cl_${Math.random().toString(16).slice(2, 14)}`,
  updatedAt: new Date().toISOString(),
  hue: 200,
});
