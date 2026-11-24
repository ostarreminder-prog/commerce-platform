"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppWebhook, useSaveAppWebhook } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { EVENTS } from "../apps/app-editor-constants";
import { AppLoader } from "./app-loader";

function Deliveries({ appId }: { appId: string }) {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const query = useAppWebhook(appId);
  const deliveries = query.data?.deliveries ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("detail.deliveries")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {query.isPending ? (
          <Skeleton className="m-5 h-40" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("detail.deliveryEvent")}</TableHead>
                <TableHead>{t("detail.deliveryStatus")}</TableHead>
                <TableHead>{t("detail.deliveryCode")}</TableHead>
                <TableHead>{t("detail.deliveryAttempt")}</TableHead>
                <TableHead>{t("detail.deliveryDuration")}</TableHead>
                <TableHead>{t("detail.deliveryAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs" dir="ltr">
                      {d.event}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === "succeeded" ? "success" : "destructive"}>
                      {t(d.status === "succeeded" ? "detail.delivered" : "detail.failed")}
                    </Badge>
                  </TableCell>
                  <TableCell className="num">{d.httpCode}</TableCell>
                  <TableCell className="num">{formatNumber(d.attempt)}</TableCell>
                  <TableCell className="num" dir="ltr">
                    {formatNumber(d.durationMs)}ms
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatRelativeTime(d.at, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WebhooksForm({ app }: { app: PartnerApp }) {
  const t = useTranslations();
  const save = useSaveAppWebhook(app.id);
  const query = useAppWebhook(app.id);
  const [url, setUrl] = React.useState(app.webhookUrl);
  const [events, setEvents] = React.useState<string[] | null>(null);
  const subscribed = events ?? query.data?.events ?? [];
  const valid = url === "" || url.startsWith("https://");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="webhook">{t("editor.webhookUrl")}</Label>
            <div className="flex gap-2">
              <Input id="webhook" dir="ltr" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button
                variant="outline"
                disabled={!url.startsWith("https://")}
                onClick={() => toast.success(t("editor.testSent"))}
              >
                <Send aria-hidden />
                <span className="hidden sm:inline">{t("editor.sendTest")}</span>
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">{t("detail.noWebhook")}</p>
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">{t("editor.events")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {EVENTS.map((ev) => (
                <label key={ev} className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
                  <Checkbox
                    checked={subscribed.includes(ev)}
                    onCheckedChange={(v) =>
                      setEvents((s) => {
                        const base = s ?? query.data?.events ?? [];
                        return v === true ? [...new Set([...base, ev])] : base.filter((x) => x !== ev);
                      })
                    }
                  />
                  <code className="font-mono text-xs" dir="ltr">
                    {ev}
                  </code>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end">
            <Button
              disabled={!valid}
              loading={save.isPending}
              onClick={() => save.mutate({ url, events: subscribed }, { onSuccess: () => toast.success(t("common.saved")) })}
            >
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Deliveries appId={app.id} />
    </div>
  );
}

export function WebhooksTab({ id }: { id: string }) {
  return <AppLoader id={id}>{(app) => <WebhooksForm app={app} />}</AppLoader>;
}
