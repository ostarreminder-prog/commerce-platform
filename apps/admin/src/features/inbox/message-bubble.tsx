"use client";

import { CheckCheck, FileText, Link2, StickyNote, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderById, useProductById } from "@repo/api-client";
import type { Message } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { Actor } from "@/components/entity/actor";
import { EntityLink } from "@/components/entity/entity-link";
import { fmtTime } from "./inbox-utils";

function ProductCardMessage({ productId }: { productId: string }) {
  const t = useTranslations("inbox");
  const { locale } = useAppLocale();
  const product = useProductById(productId);
  const p = product.data;
  if (!p) return <Skeleton className="h-20 w-64" />;
  return (
    <div className="bg-background flex w-64 items-center gap-3 rounded-md border p-2">
      <MediaThumb url={p.media[0]?.url} label={p.name.ar} className="size-12" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{p.name[locale] ?? p.name.ar}</p>
        <p className="num text-muted-foreground text-xs">{formatMoney(p.variants[0]?.price.amount ?? 0, locale)}</p>
      </div>
      <Button size="sm" variant="secondary" asChild><Link href={`/products/${p.id}`}>{t("view")}</Link></Button>
    </div>
  );
}

function OrderCardMessage({ orderId }: { orderId: string }) {
  const t = useTranslations("inbox");
  const { locale } = useAppLocale();
  const order = useOrderById(orderId);
  const o = order.data;
  if (!o) return <Skeleton className="h-16 w-64" />;
  return (
    <div className="bg-background w-64 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <EntityLink type="order" id={o.id} />
        <StatusBadge entity="order" value={o.status} />
      </div>
      <p className="num text-muted-foreground mt-1 text-xs">{formatMoney(o.total.amount, locale)} · {formatNumber(o.items.length)} {t("items")}</p>
    </div>
  );
}

export function MessageBubble({ m }: { m: Message }) {
  const t = useTranslations("inbox");
  const { locale } = useAppLocale();
  if (m.type === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">{({ takeover: t("system.takeover"), returned_to_agent: t("system.returned_to_agent"), resolved: t("system.resolved"), closed: t("system.closed"), approval_approved: t("system.approval_approved"), approval_rejected: t("system.approval_rejected"), reopened: t("system.reopened"), handoff_to_human: t("system.handoff_to_human") } as Record<string, string>)[m.content] ?? m.content}</span>
      </div>
    );
  }
  if (m.type === "internal_note") {
    return (
      <div className="flex justify-end">
        <div className="border-warning/40 bg-warning/10 w-fit max-w-[80%] rounded-lg border border-dashed p-3">
          <p className="text-warning-foreground flex items-center gap-1 text-xs font-medium"><StickyNote className="size-3" />{t("internalNote")} · <Actor actor={m.from} /></p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{m.content}</p>
          <p className="text-muted-foreground mt-1 text-[10px]">{fmtTime(m.at, locale)}</p>
        </div>
      </div>
    );
  }
  const isCustomer = m.from.type === "customer";
  return (
    <div className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
      <div className={cn("w-fit max-w-[80%] rounded-2xl p-3", isCustomer ? "bg-muted rounded-ss-sm" : "bg-primary text-primary-foreground rounded-se-sm")}>
        {!isCustomer ? <p className={cn("mb-0.5 text-[10px] opacity-80")}><Actor actor={m.from} className="text-inherit" /></p> : null}
        {m.content ? <p className="whitespace-pre-wrap text-sm">{m.content}</p> : null}
        {m.attachments.map((a) => (
          <div key={a.id} className="mt-2">
            {/\.(png|jpe?g|webp|gif)$/i.test(a.url) ? <img src={a.url} alt={a.alt[locale] ?? a.alt.ar} className="max-h-48 rounded-md" /> : (  // eslint-disable-line @next/next/no-img-element
              <span className="inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs"><FileText className="size-3.5" />{a.alt[locale] ?? a.alt.ar}</span>
            )}
          </div>
        ))}
        {m.type === "product_card" && m.ref?.type === "product" ? <ProductCardMessage productId={m.ref.id} /> : null}
        {m.type === "order_card" && m.ref?.type === "order" ? <OrderCardMessage orderId={m.ref.id} /> : null}
        {m.type === "payment_link" ? (
          <div className="bg-background text-foreground mt-1 w-64 rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium"><Link2 className="size-3.5" />{t("paymentLink")}</p>
            <bdi dir="ltr" className="num text-primary mt-1 block text-sm underline">{m.toolCalls[0]?.output}</bdi>
          </div>
        ) : null}
        {m.toolCalls.filter((tc) => tc.tool !== "paymentLink").map((tc, i) => (
          <div key={i} className="bg-background/60 text-foreground mt-2 rounded border p-2 text-xs">
            <p className="text-muted-foreground font-medium">{t("toolCall", { tool: tc.tool })}</p>
            <p className="mt-0.5">{tc.output}</p>
          </div>
        ))}
        <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", isCustomer ? "text-muted-foreground" : "opacity-80")}>
          {fmtTime(m.at, locale)}
          {m.deliveryStatus === "read" ? <CheckCheck className="size-3 text-info" aria-label={t("read")} /> : m.deliveryStatus === "failed" ? <X className="size-3 text-destructive" /> : m.deliveryStatus ? <CheckCheck className="size-3" /> : null}
        </div>
      </div>
    </div>
  );
}
