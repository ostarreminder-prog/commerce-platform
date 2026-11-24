"use client";

import * as React from "react";
import { BadgeCheck, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { NOW, useCustomerList, useOrderList, useProductReviews } from "@repo/api-client";
import type { StoreProduct } from "@/lib/store-product";
import { useSession } from "@/components/session-context";
import type { Review } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { useStoreFeatures } from "@/lib/features";
import { ReviewDialog } from "./review-dialog";

type StarFilter = "all" | "photos" | "5" | "4" | "3" | "2" | "1";
type SortKey = "newest" | "highest" | "lowest";

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex", className)} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-4", i < rating ? "fill-warning text-warning" : "text-muted")} />
      ))}
    </span>
  );
}

/** One review card — stars, text, photo thumbs, verified badge, merchant reply. */
function ReviewCard({ review: r, customerName }: { review: Review; customerName: string }) {
  const t = useTranslations("store.review");
  const { locale } = useAppLocale();
  return (
    <article className="space-y-3 border-b pb-6 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Stars rating={r.rating} />
          <span className="text-sm font-medium">{customerName}</span>
          {r.verifiedPurchase ? (
            <Badge variant="success" className="gap-1 text-[11px]">
              <BadgeCheck className="size-3" aria-hidden />
              {t("verified")}
            </Badge>
          ) : null}
        </div>
        <time dateTime={r.createdAt} className="text-muted-foreground shrink-0 text-xs">
          {formatRelativeTime(r.createdAt, locale, NOW)}
        </time>
      </div>
      <p className="text-muted-foreground leading-relaxed">{r.text}</p>
      {r.images?.length ? (
        <div className="flex gap-2">
          {r.images.map((url, i) => (
            <MediaThumb key={i} url={url} label={`${customerName} ${i + 1}`} className="size-16 rounded-lg" />
          ))}
        </div>
      ) : null}
      {r.merchantReply ? (
        <div className="bg-muted/50 space-y-1 rounded-lg p-3">
          <p className="text-xs font-semibold">{t("merchantReply")}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{r.merchantReply.text}</p>
        </div>
      ) : null}
    </article>
  );
}

/** PDP reviews section — summary + distribution + filter/sort + cards + write dialog (spec §8.3). */
export function ProductReviews({ product: p }: { product: StoreProduct }) {
  const t = useTranslations("store.review");
  const { on } = useStoreFeatures();
  const { effective } = useSession();
  const { data: reviews = [] } = useProductReviews(p.id);
  const { data: orders = [] } = useOrderList();
  const { data: customers = [] } = useCustomerList();
  const [filter, setFilter] = React.useState<StarFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [open, setOpen] = React.useState(false);

  if (!on("reviews")) return null;

  const approved = reviews.filter((r) => r.status === "approved");
  const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;
  const nameOf = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  /* Mock gate: the review form opens only when the product shipped in a
   * delivered order — otherwise a hint explains why. */
  const canReview = orders.some((o) => o.customerId === effective?.id && o.fulfillmentStatus === "delivered" && o.items.some((i) => i.productId === p.id));

  const visible = approved
    .filter((r) => (filter === "all" ? true : filter === "photos" ? Boolean(r.images?.length) : r.rating === Number(filter)))
    .sort((a, b) => (sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : sort === "highest" ? b.rating - a.rating : a.rating - b.rating));

  const chips: { key: StarFilter; label: string }[] = [
    { key: "all", label: t("filters.all") },
    { key: "photos", label: t("filters.withPhotos") },
    ...([5, 4, 3, 2, 1] as const).map((n) => ({ key: String(n) as StarFilter, label: t("filters.stars", { count: formatNumber(n) }) })),
  ];

  return (
    <section className="space-y-6" aria-label={t("title")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("title")}</h2>
        {canReview ? <Button variant="outline" onClick={() => setOpen(true)}>{t("write")}</Button> : null}
      </div>
      {approved.length ? (
        <>
          <div className="grid gap-6 rounded-2xl border p-6 sm:grid-cols-[auto_1fr]">
            <div className="space-y-1 text-center sm:text-start">
              <p className="num text-4xl font-bold">{formatNumber(avg, { maximumFractionDigits: 1 })}</p>
              <Stars rating={Math.round(avg)} className="justify-center sm:justify-start" />
              <p className="text-muted-foreground num text-xs">{t("basedOn", { count: formatNumber(approved.length) })}</p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = approved.filter((r) => r.rating === n).length;
                const pct = approved.length ? (count / approved.length) * 100 : 0;
                return (
                  <button key={n} type="button" onClick={() => setFilter(String(n) as StarFilter)} className="group flex w-full items-center gap-2 text-xs" aria-label={t("filters.stars", { count: formatNumber(n) })}>
                    <span className="num w-4">{formatNumber(n)}</span>
                    <Star className="size-3 fill-warning text-warning" aria-hidden />
                    <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <span className="bg-warning block h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-muted-foreground num w-6 text-end">{formatNumber(count)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("title")}>
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={filter === c.key}
                  onClick={() => setFilter(c.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filter === c.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-40" aria-label={t("sort.newest")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sort.newest")}</SelectItem>
                <SelectItem value="highest">{t("sort.highest")}</SelectItem>
                <SelectItem value="lowest">{t("sort.lowest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-6">
            {visible.length ? visible.map((r) => <ReviewCard key={r.id} review={r} customerName={nameOf(r.customerId)} />) : <p className="text-muted-foreground py-6 text-center text-sm">{t("emptyFiltered")}</p>}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground rounded-2xl border border-dashed py-8 text-center text-sm">{t("empty")}</p>
      )}
      {!canReview ? <p className="text-muted-foreground text-center text-xs">{t("onlyAfterDelivery")}</p> : null}
      {open ? <ReviewDialog product={p} open={open} onOpenChange={setOpen} /> : null}
    </section>
  );
}
