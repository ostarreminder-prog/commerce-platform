"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationPrefs, useSetNotificationPref } from "@repo/api-client";
import { Banner } from "@repo/ui/components/banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { EVENT_ICONS, EVENTS, PREF_CHANNELS } from "./notifications-shared";

/**
 * Notification preferences — per-event × per-channel toggles persisted via
 * `commerce.notifications.setPref`. Only `inapp` is delivered for real, so the
 * external channels are labelled as stored preferences (no real delivery yet).
 */
export function PrefsPanel() {
  const t = useTranslations("notifications.prefs");
  const mt = useMsgToast();
  const prefs = useNotificationPrefs();
  const setPref = useSetNotificationPref();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Banner variant="info">{t("simulatedHint")}</Banner>
        <DataState state={prefs} loading={<Skeleton className="h-64 w-full rounded-lg" />} isEmpty={(d) => !d}>
          {(matrix) => (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("event")}</TableHead>
                    {PREF_CHANNELS.map((c) => (
                      <TableHead key={c} className="text-center">{t(`channels.${c}`)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EVENTS.map((event) => {
                    const Icon = EVENT_ICONS[event];
                    return (
                      <TableRow key={event}>
                        <TableCell>
                          <span className="flex items-center gap-2 text-sm">
                            <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                            {t(`events.${event}`)}
                          </span>
                        </TableCell>
                        {PREF_CHANNELS.map((channel) => (
                          <TableCell key={channel} className="text-center">
                            <Switch
                              checked={matrix?.matrix[event]?.[channel] ?? false}
                              disabled={setPref.isPending}
                              aria-label={`${t(`channels.${channel}`)} — ${t(`events.${event}`)}`}
                              onCheckedChange={(enabled) =>
                                setPref.mutate([event, channel, enabled], {
                                  onSuccess: () => mt.success("notifications.prefSaved"),
                                  onError: () => mt.error("common.save.error"),
                                })
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DataState>
        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("inappNote")}
        </p>
      </CardContent>
    </Card>
  );
}
