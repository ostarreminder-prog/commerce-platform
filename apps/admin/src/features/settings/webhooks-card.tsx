"use client";

import * as React from "react";
import { Plus, RotateCcw, Webhook } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateStoreWebhook, useResendWebhookDelivery, useStoreWebhooks } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Label } from "@repo/ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";

const EVENTS = ["order.created", "order.paid", "order.shipped", "customer.created", "app.uninstalled"] as const;


export function WebhooksCard() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data: webhooks, isPending } = useStoreWebhooks();
  const createWh = useCreateStoreWebhook();
  const resend = useResendWebhookDelivery();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<Set<string>>(new Set());
  if (isPending || !webhooks) return <Skeleton className="h-96 w-full" />;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="size-4" aria-hidden /> {t("developers.webhooks.title")}
            </CardTitle>
            <CardDescription>{t("developers.webhooks.hint")}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus aria-hidden /> {t("developers.webhooks.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((wh) => (
            <div key={wh.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <code dir="ltr" className="flex-1 break-all text-sm">
                  {wh.url}
                </code>
                <Badge variant={wh.status === "active" ? "success" : "destructive"}>{t(`developers.webhooks.status.${wh.status}`)}</Badge>
              </div>
              {wh.status === "disabled_failing" ? <Banner variant="error" textKey="developers.webhook.disabled" /> : null}
              <div className="flex flex-wrap gap-1">
                {wh.events.map((e) => (
                  <code key={e} dir="ltr" className="bg-muted rounded px-1.5 py-0.5 text-xs">
                    {e}
                  </code>
                ))}
              </div>
              {wh.deliveries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("developers.deliveries.event")}</TableHead>
                      <TableHead>{t("developers.deliveries.status")}</TableHead>
                      <TableHead>{t("developers.deliveries.attempt")}</TableHead>
                      <TableHead>{t("developers.deliveries.at")}</TableHead>
                      <TableHead>{t("developers.deliveries.duration")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wh.deliveries.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell dir="ltr" className="text-start text-xs">
                          {d.event}
                        </TableCell>
                        <TableCell>
                          <Badge variant={d.status === "succeeded" ? "success" : "destructive"}>
                            {t(`developers.deliveries.${d.status}`)} ({d.httpCode})
                          </Badge>
                        </TableCell>
                        <TableCell className="num">{d.attempt}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDateTime(new Date(d.at), locale)}</TableCell>
                        <TableCell className="num text-xs">{d.durationMs}ms</TableCell>
                        <TableCell>
                          {d.status === "failed" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={resend.isPending}
                              onClick={() => resend.mutate([wh.id, d.id], { onSuccess: () => mt.success("developers.webhook.resent") })}
                            >
                              <RotateCcw aria-hidden /> {t("developers.resend")}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("developers.webhooks.add")}</DialogTitle>
            <DialogDescription>{t("developers.webhooks.addHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wh-url">{t("developers.webhooks.url")}</Label>
              <Input id="wh-url" dir="ltr" className="text-start" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {EVENTS.map((e) => (
                <Label key={e} className="flex items-center gap-2 text-sm font-normal" dir="ltr">
                  <Checkbox
                    checked={events.has(e)}
                    onCheckedChange={(v) =>
                      setEvents((all) => {
                        const next = new Set(all);
                        if (v) next.add(e);
                        else next.delete(e);
                        return next;
                      })
                    }
                  />
                  {e}
                </Label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              loading={createWh.isPending}
              disabled={!url.startsWith("https://") || events.size === 0}
              onClick={() =>
                createWh.mutate([{ url, events: [...events] }], {
                  onSuccess: () => {
                    mt.success("developers.webhook.created");
                    setOpen(false);
                    setUrl("");
                    setEvents(new Set());
                  },
                  onError: () => mt.error("validation.url"),
                })
              }
            >
              {t("developers.webhooks.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
