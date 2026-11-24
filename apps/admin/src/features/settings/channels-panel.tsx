"use client";

import * as React from "react";
import { MessageCircle, Phone, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useChannelSettings, useSaveChannelSettings } from "@repo/api-client";
import type { ChannelNumber } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Field } from "./settings-fields";

function NumbersCard({
  title,
  icon: Icon,
  numbers,
  agentName,
  onDisconnect,
}: {
  title: string;
  icon: typeof Phone;
  numbers: ChannelNumber[];
  agentName: (id: string | null) => string;
  onDisconnect: (n: ChannelNumber) => void;
}) {
  const t = useTranslations("settings");
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" aria-hidden /> {title}
        </CardTitle>
        <Button size="sm" variant="outline">
          <Plus aria-hidden /> {t("channels.add")}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("channels.cols.phone")}</TableHead>
              <TableHead>{t("channels.cols.displayName")}</TableHead>
              <TableHead>{t("channels.cols.status")}</TableHead>
              <TableHead>{t("channels.cols.quality")}</TableHead>
              <TableHead>{t("channels.cols.agent")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {numbers.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="num" dir="ltr">
                  {n.phone}
                </TableCell>
                <TableCell>{n.displayName}</TableCell>
                <TableCell>
                  <Badge variant={n.status === "active" ? "success" : n.status === "pending" ? "warning" : "secondary"}>{t(`channels.numStatus.${n.status}`)}</Badge>
                </TableCell>
                <TableCell>{n.qualityRating ? t(`channels.quality.${n.qualityRating}`) : "—"}</TableCell>
                <TableCell>{agentName(n.agentId)}</TableCell>
                <TableCell>
                  {n.status === "active" ? (
                    <Button variant="ghost" size="sm" onClick={() => onDisconnect(n)}>
                      {t("channels.disconnect")}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Channels — WhatsApp/voice numbers + web chat (spec §4.20). */
export function ChannelsPanel() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { data, isPending } = useChannelSettings();
  const save = useSaveChannelSettings();
  const { data: agents } = useAgents();
  const [disconnect, setDisconnect] = React.useState<ChannelNumber | null>(null);
  const agentName = (id: string | null) => agents?.find((a) => a.id === id)?.name ?? "—";
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const confirmDisconnect = () => {
    if (!disconnect) return;
    const mark = (list: ChannelNumber[]) => list.map((n) => (n.id === disconnect.id ? { ...n, status: "disconnected" as const } : n));
    save.mutate([{ whatsappNumbers: mark(data.whatsappNumbers), voiceNumbers: mark(data.voiceNumbers) }], { onSuccess: () => mt.success("common.save.success") });
    setDisconnect(null);
  };
  return (
    <div className="space-y-4">
      <NumbersCard title={t("channels.whatsapp")} icon={MessageCircle} numbers={data.whatsappNumbers} agentName={agentName} onDisconnect={setDisconnect} />
      <NumbersCard title={t("channels.voice")} icon={Phone} numbers={data.voiceNumbers} agentName={agentName} onDisconnect={setDisconnect} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("channels.webchat.title")}</CardTitle>
          <CardDescription>{t("channels.webchat.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label htmlFor="wc-enabled" className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <span className="text-sm font-medium">{t("channels.webchat.enabled")}</span>
            <Switch
              id="wc-enabled"
              checked={data.webchat.enabled}
              onCheckedChange={(v) => save.mutate([{ webchat: { ...data.webchat, enabled: v } }], { onSuccess: () => mt.success("common.save.success") })}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="wc-greeting" label={t("channels.webchat.greeting")} defaultValue={data.webchat.greeting} />
            <Field id="wc-agent" label={t("channels.webchat.agent")} defaultValue={agentName(data.webchat.agentId)} readOnly />
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={disconnect !== null}
        onOpenChange={(o) => !o && setDisconnect(null)}
        titleKey="channels.whatsapp.disconnect.title"
        bodyKey="channels.whatsapp.disconnect.body"
        params={{ phone: disconnect?.phone ?? "" }}
        danger
        onConfirm={confirmDisconnect}
      />
    </div>
  );
}
