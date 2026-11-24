"use client";

import { useTranslations } from "next-intl";
import { useAgents, useEntityRecord, type PreviewableEntity } from "@repo/api-client";
import type { AbandonedCart, AgentApproval, Collection, Conversation, Coupon, Customer, EntityType, ImportJob, Invoice, KnowledgeSource, Order, Product, Return, Shipment } from "@repo/contracts";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { StatusBadge } from "@repo/ui/components/status-badge";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate font-medium">{children}</dd>
    </div>
  );
}

function Card({ title, badge, children }: { title: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">{title}</p>
        {badge}
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

/** Four key facts per entity, shown on EntityLink hover / Shift+click. */
export function EntityPreview({ type, id }: { type: EntityType; id: string }) {
  const t = useTranslations("entity.preview");
  const { locale } = useAppLocale();
  const isAgent = type === "agent";
  const rec = useEntityRecord((isAgent ? "order" : type) as PreviewableEntity, id, !isAgent);
  const agents = useAgents();
  const loc = (v: { ar: string; en?: string }) => (locale === "en" && v.en) || v.ar;

  if (isAgent) {
    const a = agents.data?.find((x) => x.id === id);
    if (!a) return <div className="p-4">{agents.isPending ? <Skeleton className="h-20" /> : t("notFound")}</div>;
    return (
      <Card title={a.name} badge={<StatusBadge entity="agent" value={a.status} />}>
        <Row label={t("role")}>{t(`roles.${a.role}`)}</Row>
        <Row label={t("channels")}>{a.channels.map((c) => t(`channelNames.${c}`)).join("، ")}</Row>
      </Card>
    );
  }
  if (rec.isPending) return <div className="space-y-2 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-16" /></div>;
  if (!rec.data) return <div className="text-muted-foreground p-4 text-sm">{t("notFound")}</div>;

  switch (type) {
    case "order": {
      const o = rec.data as Order;
      return (
        <Card title={`#${o.number}`} badge={<StatusBadge entity="order" value={o.status} />}>
          <Row label={t("total")}>{formatMoney(o.total.amount, locale)}</Row>
          <Row label={t("payment")}><StatusBadge entity="order" field="paymentStatus" value={o.paymentStatus} /></Row>
          <Row label={t("fulfillment")}><StatusBadge entity="order" field="fulfillmentStatus" value={o.fulfillmentStatus} /></Row>
          <Row label={t("createdAt")}>{formatRelativeTime(o.createdAt, locale)}</Row>
        </Card>
      );
    }
    case "customer": {
      const c = rec.data as Customer;
      return (
        <Card title={c.name ?? c.phone} badge={<StatusBadge entity="customer" field="segment" value={c.segment} />}>
          <Row label={t("phone")}><bdi dir="ltr">{c.phone}</bdi></Row>
          <Row label={t("ordersCount")}>{formatNumber(c.stats.ordersCount)}</Row>
          <Row label={t("totalSpent")}>{formatMoney(c.stats.totalSpent.amount, locale)}</Row>
          <Row label={t("lastOrder")}>{c.stats.lastOrderAt ? formatRelativeTime(c.stats.lastOrderAt, locale) : "—"}</Row>
        </Card>
      );
    }
    case "product": {
      const p = rec.data as Product;
      return (
        <Card title={loc(p.name)} badge={<StatusBadge entity="product" value={p.status} />}>
          <Row label={t("price")}>{p.variants[0] ? formatMoney(p.variants[0].price.amount, locale) : "—"}</Row>
          <Row label={t("variants")}>{formatNumber(p.variants.length)}</Row>
          <Row label={t("sold30d")}>{formatNumber(p.stats.sold30d)}</Row>
          <Row label={t("sku")}><bdi dir="ltr">{p.variants[0]?.sku}</bdi></Row>
        </Card>
      );
    }
    case "conversation": {
      const c = rec.data as Conversation;
      return (
        <Card title={c.contact.name ?? c.contact.phone} badge={<StatusBadge entity="conversation" value={c.status} />}>
          <Row label={t("channel")}>{t(`channelNames.${c.channel}`)}</Row>
          <Row label={t("updatedAt")}>{formatRelativeTime(c.updatedAt, locale)}</Row>
          <Row label={t("messages")}>{formatNumber(c.messages.length)}</Row>
          <Row label={t("summary")}>{c.aiSummary}</Row>
        </Card>
      );
    }
    case "shipment": {
      const s = rec.data as Shipment;
      return (
        <Card title={s.carrier} badge={<StatusBadge entity="shipment" value={s.status} />}>
          <Row label={t("tracking")}><bdi dir="ltr">{s.trackingNumber ?? "—"}</bdi></Row>
          <Row label={t("eta")}>{s.estimatedDelivery ? formatDate(s.estimatedDelivery, locale) : "—"}</Row>
          <Row label={t("cod")}>{s.codAmount ? formatMoney(s.codAmount.amount, locale) : "—"}</Row>
          <Row label={t("lastUpdate")}>{(() => { const last = s.events.at(-1); return last ? formatRelativeTime(last.at, locale) : "—"; })()}</Row>
        </Card>
      );
    }
    case "invoice": {
      const i = rec.data as Invoice;
      return (
        <Card title={<bdi dir="ltr">{i.number}</bdi>} badge={<StatusBadge entity="invoice" field="zatcaStatus" value={i.zatcaStatus} />}>
          <Row label={t("type")}>{t(`invoiceTypes.${i.type}`)}</Row>
          <Row label={t("total")}>{formatMoney(i.total.amount, locale)}</Row>
          <Row label={t("vat")}>{formatMoney(i.vatAmount.amount, locale)}</Row>
          <Row label={t("issuedAt")}>{formatDate(i.issuedAt, locale)}</Row>
        </Card>
      );
    }
    case "return": {
      const r = rec.data as Return;
      return (
        <Card title={`#${r.number}`} badge={<StatusBadge entity="return" value={r.status} />}>
          <Row label={t("reason")}>{t(`returnReasons.${r.reason}`)}</Row>
          <Row label={t("items")}>{formatNumber(r.items.reduce((s, x) => s + x.quantity, 0))}</Row>
          <Row label={t("refund")}>{r.refundAmount ? formatMoney(r.refundAmount.amount, locale) : "—"}</Row>
          <Row label={t("createdAt")}>{formatRelativeTime(r.createdAt, locale)}</Row>
        </Card>
      );
    }
    case "abandonedCart": {
      const c = rec.data as AbandonedCart;
      return (
        <Card title={<bdi dir="ltr">{c.phone}</bdi>} badge={<StatusBadge entity="abandonedCart" field="recoveryStatus" value={c.recoveryStatus} />}>
          <Row label={t("total")}>{formatMoney(c.total.amount, locale)}</Row>
          <Row label={t("items")}>{formatNumber(c.items.length)}</Row>
          <Row label={t("attempts")}>{formatNumber(c.recoveryAttempts.length)}</Row>
          <Row label={t("abandonedAt")}>{formatRelativeTime(c.abandonedAt, locale)}</Row>
        </Card>
      );
    }
    case "collection": {
      const c = rec.data as Collection;
      return (
        <Card title={loc(c.name)} badge={<StatusBadge entity="common" field="type" value={c.type} />}>
          <Row label={t("type")}>{t(`collectionTypes.${c.type}`)}</Row>
          <Row label={t("products")}>{formatNumber(c.type === "manual" ? c.productIds.length : c.rules.length)}</Row>
        </Card>
      );
    }
    case "coupon": {
      const c = rec.data as Coupon;
      return (
        <Card title={<bdi dir="ltr">{c.code}</bdi>} badge={<StatusBadge entity="coupon" value={c.status} />}>
          <Row label={t("type")}>{t(`couponTypes.${c.type}`)}</Row>
          <Row label={t("uses")}>{formatNumber(c.stats.uses)}</Row>
          <Row label={t("revenue")}>{formatMoney(c.stats.revenue.amount, locale)}</Row>
        </Card>
      );
    }
    case "knowledge": {
      const k = rec.data as KnowledgeSource;
      return (
        <Card title={k.title} badge={<StatusBadge entity="knowledge" value={k.status} />}>
          <Row label={t("type")}>{t(`knowledgeTypes.${k.type}`)}</Row>
          <Row label={t("chunks")}>{formatNumber(k.chunksCount)}</Row>
          <Row label={t("agents")}>{formatNumber(k.usedByAgentIds.length)}</Row>
        </Card>
      );
    }
    case "import": {
      const j = rec.data as ImportJob;
      return (
        <Card title={<bdi dir="ltr">{j.fileName}</bdi>} badge={<StatusBadge entity="import" value={j.status} />}>
          <Row label={t("type")}>{t(`importTypes.${j.type}`)}</Row>
          <Row label={t("succeeded")}>{formatNumber(j.rowsSucceeded)}</Row>
          <Row label={t("failed")}>{formatNumber(j.rowsFailed)}</Row>
        </Card>
      );
    }
    case "approval": {
      const a = rec.data as AgentApproval;
      return (
        <Card title={t(`approvalActions.${a.action}`)} badge={<StatusBadge entity="approval" value={a.status} />}>
          <Row label={t("amount")}>{a.amount ? formatMoney(a.amount.amount, locale) : "—"}</Row>
          <Row label={t("reason")}>{a.reason}</Row>
        </Card>
      );
    }
    default:
      return null;
  }
}
