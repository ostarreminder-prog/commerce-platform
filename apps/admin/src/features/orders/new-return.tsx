"use client";

import * as React from "react";
import { ImagePlus, PackageOpen, RotateCcw, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCreateReturn, useOrderList, useReturnList, useReturnPolicy } from "@repo/api-client";
import type { Order, ReturnReason } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";

const REASONS: ReturnReason[] = ["damaged", "wrong_item", "not_as_described", "size_issue", "changed_mind", "other"];

interface Photo { id: string; url: string; alt: { ar: string; en: string }; width: number; height: number }

/** Submit a return request against an order (SCREENS_SPEC §5.2). Eligibility —
 * window days, non-returnable products, enabled reasons — is enforced
 * server-side from the merchant's return policy. */
export function NewReturn() {
  const t = useTranslations("sales.newReturn");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useSearchParams();
  const canManage = useCan("returns.manage");
  const orders = useOrderList();
  const policy = useReturnPolicy();
  const returns = useReturnList();
  const create = useCreateReturn();

  const [orderId, setOrderId] = React.useState(params.get("order") ?? "");
  const [picked, setPicked] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState<ReturnReason>("damaged");
  const [note, setNote] = React.useState("");
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const order: Order | undefined = orders.data?.find((o) => o.id === orderId);
  /* Orders the policy would even consider — delivered/shipped, not cancelled. */
  const eligibleOrders = React.useMemo(
    () => (orders.data ?? []).filter((o) => o.status !== "cancelled" && (o.fulfillmentStatus === "delivered" || o.fulfillmentStatus === "shipped")),
    [orders.data],
  );
  const nonReturnable = React.useMemo(() => new Set(policy.data?.nonReturnableProductIds ?? []), [policy.data]);
  const enabledReasons = React.useMemo(() => REASONS.filter((r) => !policy.data || policy.data.reasons.includes(r)), [policy.data]);
  /* Remaining qty per line = ordered − returned − refunded − pending in open
   * returns for this order (same cap the server enforces). */
  const pending = React.useMemo(() => {
    const m = new Map<string, number>();
    (returns.data ?? [])
      .filter((r) => r.orderId === orderId && !["rejected", "closed"].includes(r.status))
      .forEach((r) => r.items.forEach((l) => m.set(l.orderItemId, (m.get(l.orderItemId) ?? 0) + l.quantity)));
    return m;
  }, [returns.data, orderId]);
  const items = order?.items.map((i) => ({ item: i, remaining: i.quantity - i.returnedQty - i.refundedQty - (pending.get(i.id) ?? 0) })) ?? [];
  const lines = Object.entries(picked).filter(([, q]) => q > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity, reason }));

  if (!canManage) {
    return <Card><EmptyState icon={RotateCcw} title={t("noPermissionTitle")} description={t("noPermissionDescription")} action={<Button asChild variant="outline"><Link href="/returns">{t("back")}</Link></Button>} /></Card>;
  }

  const submit = () => {
    setError(null);
    create.mutate(
      [{ orderId, items: lines, reason, customerNote: note.trim() || undefined, photos: photos.length ? photos : undefined }],
      {
        onSuccess: (r) => { toast.success(t("created", { number: r.number })); router.push(`/returns/${r.id}`); },
        onError: (err) => {
          const code = (err as Error).message;
          setError(t.has(`errors.${code}` as never) ? t(`errors.${code}` as never) : t("errors.failed"));
        },
      },
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Breadcrumbs items={[{ label: ts("returns.title"), href: recallListUrl("/returns") }, { label: t("title") }]} />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
        {policy.data ? <p className="text-muted-foreground mt-1 text-xs">{t("policyHint", { days: policy.data.windowDays })}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("selectOrder")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {orders.isPending ? <Skeleton className="h-10 w-full" /> : (
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger aria-label={t("selectOrder")}><SelectValue placeholder={t("selectOrderPlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {eligibleOrders.map((o) => <SelectItem key={o.id} value={o.id} className="num">#{o.number}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {order ? (
                <ul className="divide-y rounded-md border">
                  {items.map(({ item, remaining }) => {
                    const blocked = remaining <= 0 || nonReturnable.has(item.productId);
                    return (
                      <li key={item.id} className="flex items-center gap-3 p-3 text-sm">
                        <Checkbox
                          id={`ri-${item.id}`} disabled={blocked}
                          checked={(picked[item.id] ?? 0) > 0}
                          onCheckedChange={(v) => setPicked((m) => ({ ...m, [item.id]: v === true ? remaining : 0 }))}
                        />
                        <MediaThumb url={item.image?.url} label={item.productName[locale] ?? item.productName.ar} />
                        <div className="min-w-0 flex-1">
                          <EntityLink type="product" id={item.productId} label={item.productName[locale] ?? item.productName.ar} className="line-clamp-1" />
                          <p className="num text-muted-foreground text-xs" dir="ltr">{item.sku}</p>
                          {nonReturnable.has(item.productId) ? <p className="text-destructive text-xs">{t("notReturnable")}</p> : null}
                          {remaining <= 0 && !nonReturnable.has(item.productId) ? <p className="text-muted-foreground text-xs">{t("alreadyReturned")}</p> : null}
                        </div>
                        {(picked[item.id] ?? 0) > 0 ? (
                          <Input
                            className="num h-8 w-16 text-center" dir="ltr" inputMode="numeric" aria-label={t("quantity")}
                            value={picked[item.id]} min={1} max={remaining}
                            onChange={(e) => setPicked((m) => ({ ...m, [item.id]: Math.max(1, Math.min(remaining, Number(e.target.value) || 1)) }))}
                          />
                        ) : <span className="num text-muted-foreground">× {remaining}</span>}
                        <span className="num w-20 text-end">{formatMoney(item.unitPrice.amount, locale)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("details")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("reason")} *</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
                  <SelectTrigger aria-label={t("reason")}><SelectValue /></SelectTrigger>
                  <SelectContent>{enabledReasons.map((r) => <SelectItem key={r} value={r}>{ts(`returnReasons.${r}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-note">{t("note")}</Label>
                <Textarea id="nr-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("photos")}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {photos.map((p) => (
                    <span key={p.id} className="relative">
                      <MediaThumb url={p.url} label={p.alt[locale] ?? p.alt.ar} className="size-16" />
                      <button type="button" aria-label={t("removePhoto")} className="bg-background absolute -end-1 -top-1 rounded-full border p-0.5" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}><X className="size-3" /></button>
                    </span>
                  ))}
                  {/* Mock upload — attaches a placeholder media ref like a real
                   * picker would return after upload. */}
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => setPhotos((ps) => [...ps, { id: crypto.randomUUID(), url: `placeholder:${(ps.length * 47) % 360}`, alt: { ar: "مرفق إرجاع", en: "Return attachment" }, width: 400, height: 400 }])}
                  >
                    <ImagePlus aria-hidden />{t("addPhoto")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("summaryOrder")}</span>{order ? <EntityLink type="order" id={order.id} className="num" /> : "—"}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("summaryItems")}</span><span className="num">{lines.reduce((s, l) => s + l.quantity, 0)}</span></div>
              {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
              <Button className="w-full" disabled={create.isPending || !lines.length || !orderId} onClick={submit}>
                <PackageOpen aria-hidden />{t("submit")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
