"use client";

import * as React from "react";
import { Check, MessageCircleQuestion, PackageCheck, Undo2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddReturnNote, useOrderList, useReturnById, useSetReturnStatus } from "@repo/api-client";
import type { Return } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { recallListUrl } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { itemsOf } from "./return-utils";
import { ApproveDialog, RejectDialog, RefundConfirm, RequestInfoDialog } from "./return-dialogs";
import { Timeline } from "@/components/entity/timeline";

function ReturnDetail({ ret }: { ret: Return }) {
  const t = useTranslations("sales.returns");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const canManage = useCan("returns.manage");
  const canRefund = useCan("orders.refund");
  const orders = useOrderList();
  const setStatus = useSetReturnStatus();
  const [dialog, setDialog] = React.useState<"approve" | "reject" | "refund" | "info" | null>(null);
  /* Decision is pending while the request is open OR waiting on more info. */
  const undecided = ret.status === "requested" || ret.status === "info_requested";
  const order = orders.data?.find((o) => o.id === ret.orderId);
  const lines = itemsOf(ret, order);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Breadcrumbs items={[{ label: t("title"), href: recallListUrl("/returns") }, { label: `#${ret.number}` }]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="num text-2xl font-semibold tracking-tight">{t("heading", { number: ret.number })}</h1>
              <StatusBadge entity="return" value={ret.status} />
            </div>
            <p className="text-muted-foreground text-sm">{formatDateTime(ret.createdAt, locale)}</p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {undecided ? (
                <>
                  <Button onClick={() => setDialog("approve")}><Check aria-hidden />{t("actions.approve")}</Button>
                  <Button variant="outline" onClick={() => setDialog("info")}><MessageCircleQuestion aria-hidden />{t("actions.requestInfo")}</Button>
                  <Button variant="outline" className="text-destructive" onClick={() => setDialog("reject")}><X aria-hidden />{t("actions.reject")}</Button>
                </>
              ) : null}
              {ret.status === "approved" || ret.status === "in_transit" ? (
                <Button onClick={() => setStatus.mutate([ret.id, "received"], { onSuccess: () => toast.success(t("receivedDone")) })} disabled={setStatus.isPending}>
                  <PackageCheck aria-hidden />{t("actions.receive")}
                </Button>
              ) : null}
              {ret.status === "received" && ret.resolution === "refund" && canRefund ? (
                <Button variant="destructive" onClick={() => setDialog("refund")}><Undo2 aria-hidden />{t("actions.refund")}</Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {ret.status === "rejected" && ret.rejectionReason ? (
        <Alert variant="destructive"><X aria-hidden /><AlertDescription>{t("rejectedBanner", { reason: ret.rejectionReason })}</AlertDescription></Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("items")}</CardTitle></CardHeader>
            <CardContent>
              {orders.isPending ? <Skeleton className="h-24" /> : (
                <ul className="divide-y rounded-md border">
                  {lines.map(({ line, item }) => {
                    const name = item ? item.productName[locale] ?? item.productName.ar : "—";
                    return (
                      <li key={line.orderItemId} className="flex items-center gap-3 p-3 text-sm">
                        <MediaThumb url={item?.image?.url} label={name} />
                        <div className="min-w-0 flex-1">
                          {item ? <EntityLink type="product" id={item.productId} label={name} className="line-clamp-1" /> : name}
                          <p className="text-muted-foreground text-xs">{ts(`returnReasons.${line.reason}`)}</p>
                        </div>
                        <span className="num">× {line.quantity}</span>
                        {item ? <span className="num w-24 text-end">{formatMoney(Math.round((item.lineTotal.amount / item.quantity) * line.quantity), locale)}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("reasonAndNote")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{ts(`returnReasons.${ret.reason}`)}</p>
              {ret.customerNote ? <p className="bg-muted/50 rounded-md p-3">{ret.customerNote}</p> : <p className="text-muted-foreground">{t("noNote")}</p>}
              {ret.photos.length ? (
                <div className="flex flex-wrap gap-2">
                  {ret.photos.map((p) => <MediaThumb key={p.id} url={p.url} label={p.alt?.[locale] ?? ""} className="size-20" />)}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("originalOrder")}</span><EntityLink type="order" id={ret.orderId} className="num" /></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("cols.customer")}</span><EntityLink type="customer" id={ret.customerId} /></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("resolution")}</span><span>{ret.resolution ? t(`approve.resolutions.${ret.resolution}`) : "—"}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("cols.refundAmount")}</span><span className="num">{ret.refundAmount ? formatMoney(ret.refundAmount.amount, locale) : "—"}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("restock")}</span><span>{ret.restock ? t("yes") : t("no")}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("returnShipment")}</span>{ret.returnShipmentId ? <EntityLink type="shipment" id={ret.returnShipmentId} className="num" /> : <span>—</span>}</div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("creditNote")}</span>{ret.creditNoteId ? <EntityLink type="invoice" id={ret.creditNoteId} className="num" /> : <span>—</span>}</div>
            </CardContent>
          </Card>
          <ReturnActivity ret={ret} canManage={canManage} />
        </div>
      </div>
      <ApproveDialog ret={ret} order={order} open={dialog === "approve"} onOpenChange={(o) => setDialog(o ? "approve" : null)} />
      <RejectDialog ret={ret} open={dialog === "reject"} onOpenChange={(o) => setDialog(o ? "reject" : null)} />
      <RefundConfirm ret={ret} open={dialog === "refund"} onOpenChange={(o) => setDialog(o ? "refund" : null)} />
      <RequestInfoDialog ret={ret} open={dialog === "info"} onOpenChange={(o) => setDialog(o ? "info" : null)} />
    </div>
  );
}

/* Per-return activity log (SCREENS_SPEC §5.2): created / status / info-request
 * / note events, newest first; staff can append notes. */
function ReturnActivity({ ret, canManage }: { ret: Return; canManage: boolean }) {
  const t = useTranslations("sales.returns.activity");
  const addNote = useAddReturnNote();
  const [note, setNote] = React.useState("");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("title")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {canManage ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = note.trim();
              if (!text) return;
              addNote.mutate([ret.id, text], { onSuccess: () => setNote(""), onError: () => toast.error(t("noteFailed")) });
            }}
          >
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} aria-label={t("notePlaceholder")} />
            <Button type="submit" size="sm" variant="outline" disabled={addNote.isPending || !note.trim()}>{t("addNote")}</Button>
          </form>
        ) : null}
        <Timeline
          items={ret.events.map((e) => ({
            id: e.id, at: e.at, actor: e.actor,
            title: t(`events.${e.type}`, e.data as Record<string, string | number>),
            body: typeof e.data.text === "string" ? e.data.text : typeof e.data.note === "string" ? e.data.note : undefined,
            tone: e.type === "created" ? "info" : e.type === "status_changed" ? "success" : e.type === "info_requested" ? "warning" : "default",
          }))}
        />
      </CardContent>
    </Card>
  );
}

export function ReturnView({ id }: { id: string }) {
  const t = useTranslations("sales.returns");
  const query = useReturnById(id);
  return (
    <DataState
      state={query}
      loading={<div className="space-y-6"><Skeleton className="h-9 w-64" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div></div>}
      error={(retry) =>
        String((query.error as Error | null)?.message ?? "").includes("not found") ? (
          <Card><EmptyState title={t("notFound")} action={<Button asChild variant="outline"><Link href="/returns">{t("back")}</Link></Button>} /></Card>
        ) : <ErrorState onRetry={retry ?? undefined} />
      }
    >
      {(r) => <ReturnDetail ret={r} />}
    </DataState>
  );
}
