"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCustomerList, useOrderList, useProductList } from "@repo/api-client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";

/** Generic searchable pick-dialog — products, orders and customers share it. */
function PickDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  loading,
  onPick,
  renderItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  items: { id: string; label: string; sub?: string }[];
  loading: boolean;
  onPick: (id: string) => void;
  renderItem?: (item: { id: string; label: string; sub?: string }) => React.ReactNode;
}) {
  const t = useTranslations("inbox.pick");
  const [q, setQ] = React.useState("");
  const visible = items.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()) || (i.sub ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-9" />
        </div>
        <ScrollArea className="max-h-72">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : visible.length ? (
            <ul className="space-y-1">
              {visible.slice(0, 30).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-md border p-2.5 text-start text-sm"
                    onClick={() => {
                      onPick(item.id);
                      onOpenChange(false);
                    }}
                  >
                    {renderItem ? (
                      renderItem(item)
                    ) : (
                      <>
                        <span className="truncate font-medium">{item.label}</span>
                        {item.sub ? <span className="num text-muted-foreground shrink-0 text-xs">{item.sub}</span> : null}
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground py-6 text-center text-sm">{t("empty")}</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ProductPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (id: string) => void }) {
  const t = useTranslations("inbox.pick");
  const { locale } = useAppLocale();
  const products = useProductList();
  return (
    <PickDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("productTitle")}
      description={t("productDescription")}
      loading={products.isPending}
      items={(products.data ?? []).filter((p) => p.status !== "archived").map((p) => ({ id: p.id, label: p.name[locale] ?? p.name.ar, sub: formatMoney(p.variants[0]?.price.amount ?? 0, locale) }))}
      onPick={onPick}
    />
  );
}

export function OrderPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (id: string) => void }) {
  const t = useTranslations("inbox.pick");
  const { locale } = useAppLocale();
  const orders = useOrderList();
  return (
    <PickDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("orderTitle")}
      description={t("orderDescription")}
      loading={orders.isPending}
      items={(orders.data ?? []).map((o) => ({ id: o.id, label: `#${o.number}`, sub: formatMoney(o.total.amount, locale) }))}
      onPick={onPick}
    />
  );
}

export function CustomerPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (id: string) => void }) {
  const t = useTranslations("inbox.pick");
  const customers = useCustomerList();
  return (
    <PickDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("customerTitle")}
      description={t("customerDescription")}
      loading={customers.isPending}
      items={(customers.data ?? []).map((c) => ({ id: c.id, label: c.name ?? c.phone, sub: c.phone }))}
      onPick={onPick}
    />
  );
}
