import {
  AlertTriangle, Bot, CreditCard, FileWarning, Gauge, MessageCircle, Puzzle, RotateCcw, ShoppingBag, Truck,
  type LucideIcon,
} from "lucide-react";
import type { AdminNotification, AdminNotificationEvent, NotificationPrefChannel } from "@repo/contracts";

export const EVENTS: AdminNotificationEvent[] = [
  "order_created", "payment_failed", "conversation_waiting", "approval_requested", "low_stock",
  "shipments_delayed", "invoice_rejected", "return_requested", "app_installed", "usage_limit",
];

export const EVENT_ICONS: Record<AdminNotificationEvent, LucideIcon> = {
  order_created: ShoppingBag, payment_failed: CreditCard, conversation_waiting: MessageCircle, approval_requested: Bot,
  low_stock: AlertTriangle, shipments_delayed: Truck, invoice_rejected: FileWarning, return_requested: RotateCcw,
  app_installed: Puzzle, usage_limit: Gauge,
};

export const PREF_CHANNELS: NotificationPrefChannel[] = ["inapp", "whatsapp", "email", "sms"];

/** URL-persisted filter defaults (useUrlState). */
export const DEFAULTS = { view: "list", box: "active", event: "all", read: "all", date: "all", q: "", limit: "10", page: "" };

const DAY_MS = 86_400_000;

export function matchesFilters(n: AdminNotification, f: typeof DEFAULTS, q: string, now = Date.now()): boolean {
  if (f.box === "active" ? n.archived : !n.archived) return false;
  if (f.event !== "all" && n.event !== f.event) return false;
  if (f.read === "unread" && n.read) return false;
  if (f.read === "read" && !n.read) return false;
  const age = now - new Date(n.at).getTime();
  if (f.date === "today" && age > DAY_MS) return false;
  if (f.date === "week" && age > 7 * DAY_MS) return false;
  if (f.date === "month" && age > 30 * DAY_MS) return false;
  if (q && !Object.values(n.params).some((v) => String(v).toLowerCase().includes(q)) && !n.event.includes(q)) return false;
  return true;
}
