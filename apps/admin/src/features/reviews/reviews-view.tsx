"use client";

import * as React from "react";
import { Check, EyeOff, MessageSquareReply, MoreHorizontal, Search, Star, StarHalf, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { NOW, useProductList, useReviewsList, useSetReviewStatus } from "@repo/api-client";
import type { Review, ReviewStatus } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, DataTableColumnHeader, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { StatusBadge, useStatusLabel } from "@repo/ui/components/status-badge";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatRelativeTime } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { useScrollRestore, useUrlState } from "@/lib/url-state";
import { ReviewReplyDialog } from "./review-reply-dialog";

const STATUSES: ReviewStatus[] = ["pending", "approved", "hidden"];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-3.5", i < rating ? "fill-warning text-warning" : "text-muted")} aria-hidden />
      ))}
    </span>
  );
}

/** Merchant review moderation queue — approve / hide / reply (spec §8.3). */
export function ReviewsView() {
  const t = useTranslations("catalog.reviews");
  const tc = useTranslations("common");
  const label = useStatusLabel();
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const [f, set] = useUrlState({ status: "all", product: "", q: "" });
  const reviews = useReviewsList();
  const { data: products = [] } = useProductList();
  const setStatus = useSetReviewStatus();
  const [replyTo, setReplyTo] = React.useState<Review | null>(null);
  useScrollRestore(reviews.isSuccess);

  const pmap = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const productName = (id: string) => {
    const p = pmap.get(id);
    return p ? (p.name[locale] ?? p.name.ar) : id;
  };
  const q = f.q.trim().toLowerCase();
  const visible = (reviews.data ?? []).filter(
    (r) => (f.status === "all" || r.status === f.status) && (!f.product || r.productId === f.product) && (!q || productName(r.productId).toLowerCase().includes(q) || r.text.toLowerCase().includes(q)),
  );

  const setReviewStatus = (r: Review, status: ReviewStatus) =>
    setStatus.mutate([r.id, status], {
      onSuccess: () => mt.success(status === "approved" ? "reviews.approved" : "reviews.hidden"),
      onError: () => mt.error("reviews.submitFailed", {}, { retry: () => setReviewStatus(r, status) }),
    });

  const columns = React.useMemo<ColumnDef<Review, unknown>[]>(() => [
    { id: "product", header: t("cols.product"), cell: ({ row }) => <EntityLink type="product" id={row.original.productId} /> },
    { id: "customer", header: t("cols.customer"), cell: ({ row }) => <EntityLink type="customer" id={row.original.customerId} /> },
    { id: "rating", accessorKey: "rating", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.rating")} />, cell: ({ row }) => <Stars rating={row.original.rating} /> },
    {
      id: "review", header: t("cols.review"),
      cell: ({ row }) => (
        <div className="max-w-xs space-y-1.5">
          <p className="line-clamp-2 text-sm">{row.original.text}</p>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {row.original.images?.length ? (
              <span className="flex">
                {row.original.images.slice(0, 3).map((url, i) => (
                  <MediaThumb key={i} url={url} label="" className="ring-background size-6 rounded ring-1 -ms-1 first:ms-0" />
                ))}
              </span>
            ) : null}
            {row.original.verifiedPurchase ? <span>{t("verified")}</span> : null}
            {row.original.merchantReply ? (
              <span className="flex items-center gap-1">
                <MessageSquareReply className="size-3" aria-hidden />
                {t("replied")}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    { id: "status", accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.status")} />, cell: ({ row }) => <StatusBadge entity="common" value={row.original.status} /> },
    { id: "date", accessorKey: "createdAt", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.date")} />, cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(row.original.createdAt, locale)}>{formatRelativeTime(row.original.createdAt, locale, NOW)}</span> },
    {
      id: "actions", header: "",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label={t("actions.menu")}>
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {r.status !== "approved" ? (
                <DropdownMenuItem onSelect={() => setReviewStatus(r, "approved")}>
                  <Check aria-hidden /> {t("actions.approve")}
                </DropdownMenuItem>
              ) : null}
              {r.status !== "hidden" ? (
                <DropdownMenuItem onSelect={() => setReviewStatus(r, "hidden")}>
                  <EyeOff aria-hidden /> {t("actions.hide")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => setReplyTo(r)}>
                <MessageSquareReply aria-hidden /> {t("actions.reply")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, locale, pmap]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataState
        state={reviews}
        loading={<TableSkeleton rows={6} columns={7} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={StarHalf} title={t("noneTitle")} description={t("noneDescription")} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("search")} aria-label={t("search")} className="ps-9" />
              </div>
              <Select value={f.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="sm:w-44" aria-label={t("cols.status")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{label("common", "status", s)}</SelectItem>)}
                </SelectContent>
              </Select>
              {f.product ? (
                <Button variant="secondary" size="sm" onClick={() => set({ product: "" })}>
                  {productName(f.product)}<X aria-hidden />
                </Button>
              ) : null}
              {f.status !== "all" || f.q || f.product ? (
                <Button variant="ghost" size="sm" onClick={() => set({ status: "all", product: "", q: "" })}>
                  <X aria-hidden /> {tc("reset")}
                </Button>
              ) : null}
            </div>
            {visible.length ? (
              <DataTable columns={columns} data={visible} getRowId={(r) => r.id} pageSize={15} />
            ) : (
              <Card><EmptyState icon={Search} title={t("emptyTitle")} description={t("emptyDescription")} /></Card>
            )}
          </div>
        )}
      </DataState>
      {replyTo ? <ReviewReplyDialog review={replyTo} productName={productName(replyTo.productId)} onClose={() => setReplyTo(null)} /> : null}
    </div>
  );
}
