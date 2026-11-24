"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationTemplates } from "@repo/api-client";
import type { NotificationEvent, NotificationTemplate } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { NotificationEditor } from "./notification-editor";

const EVENTS: NotificationEvent[] = ["order_confirmed", "payment_failed", "shipped", "out_for_delivery", "delivered", "cart_abandoned", "return_update", "otp"];
const CHANNELS: NotificationTemplate["channel"][] = ["whatsapp", "sms", "email"];

/** Notifications — template table per event × channel + editor (spec §4.20). */
export function NotificationsPanel() {
  const t = useTranslations("settings");
  const { data, isPending } = useNotificationTemplates();
  const [editing, setEditing] = React.useState<{ event: NotificationEvent; channel: NotificationTemplate["channel"] } | null>(null);
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const find = (event: NotificationEvent, channel: NotificationTemplate["channel"]) => data.find((x) => x.event === event && x.channel === channel);
  const current = editing ? find(editing.event, editing.channel) : undefined;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("nav.notifications")}</CardTitle>
        <CardDescription>{t("notifications.hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("notifications.event")}</TableHead>
              {CHANNELS.map((c) => (
                <TableHead key={c} className="text-center">
                  {t(`notifications.channels.${c}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {EVENTS.map((event) => (
              <TableRow key={event}>
                <TableCell className="font-medium">{t(`notifications.events.${event}`)}</TableCell>
                {CHANNELS.map((channel) => {
                  const tpl = find(event, channel);
                  return (
                    <TableCell key={channel} className="text-center">
                      {tpl ? (
                        <span className="inline-flex items-center gap-2">
                          <Badge variant={tpl.enabled ? "success" : "secondary"}>{t(tpl.enabled ? "notifications.on" : "notifications.off")}</Badge>
                          {channel === "whatsapp" && tpl.whatsappTemplateStatus ? (
                            <Badge variant={tpl.whatsappTemplateStatus === "approved" ? "outline" : tpl.whatsappTemplateStatus === "pending" ? "warning" : "destructive"}>
                              {t(`notifications.waStatus.${tpl.whatsappTemplateStatus}`)}
                            </Badge>
                          ) : null}
                          <Button variant="ghost" size="icon" className="size-7" aria-label={t("notifications.edit")} onClick={() => setEditing({ event, channel })}>
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setEditing({ event, channel })}>
                          {t("notifications.add")}
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {editing ? (
        <NotificationEditor
          open={editing !== null}
          onOpenChange={(o) => !o && setEditing(null)}
          event={editing.event}
          channel={editing.channel}
          template={current}
        />
      ) : null}
    </Card>
  );
}
