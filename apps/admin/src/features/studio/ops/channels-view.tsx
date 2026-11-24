"use client";

import * as React from "react";
import { MessageCircle, Phone, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useLinkNumber, usePhoneNumbers, useWhatsAppNumbers } from "@repo/api-client";
import type { PhoneNumber, WhatsAppNumber } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { Can } from "@/lib/permissions";
import { StudioHeader } from "../studio-header";
import { AddNumberDialog } from "./add-number-dialog";
import { LinkedAgent, Status } from "./channel-shared";
import { SocialChannels } from "./social-channels";

const qualityTone = { high: "bg-success", medium: "bg-warning", low: "bg-destructive" } as const;

export function ChannelsView() {
  const t = useTranslations("studio.channels");
  const phones = usePhoneNumbers();
  const whatsapp = useWhatsAppNumbers();
  const agents = useAgents();
  const link = useLinkNumber();
  const [adding, setAdding] = React.useState<"phone" | "whatsapp" | null>(null);
  const list = agents.data ?? [];
  const relink = (kind: "phone" | "whatsapp", id: string) => (agentId: string | null) =>
    link.mutate([kind, id, agentId], {
      onSuccess: () =>
        toast.success(
          agentId
            ? t("linked", { name: list.find((a) => a.id === agentId)?.name ?? "" })
            : t("unlinked"),
        ),
    });
  return (
    <div className="space-y-6">
      <StudioHeader />
      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="size-4" aria-hidden /> {t("phones")}
            </CardTitle>
            <CardDescription>{t("phonesHint")}</CardDescription>
          </div>
          <Can permission="agents.manage">
            <Button variant="outline" onClick={() => setAdding("phone")}>
              <Plus aria-hidden /> {t("addPhone")}
            </Button>
          </Can>
        </CardHeader>
        <CardContent>
          <DataState
            state={phones}
            isEmpty={(d) => d.length === 0}
            loading={<Skeleton className="h-40 w-full rounded-lg" />}
            empty={
              <EmptyState icon={Phone} title={t("noPhones")} description={t("noPhonesBody")} />
            }
          >
            {(rows: PhoneNumber[]) => (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cols.number")}</TableHead>
                      <TableHead>{t("cols.provider")}</TableHead>
                      <TableHead>{t("cols.agent")}</TableHead>
                      <TableHead>{t("cols.status")}</TableHead>
                      <TableHead>{t("cols.calls")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="num font-semibold" dir="ltr">
                          <span className="block text-start rtl:text-end">{p.number}</span>
                        </TableCell>
                        <TableCell>{p.provider}</TableCell>
                        <TableCell className="min-w-56">
                          <LinkedAgent
                            agents={list}
                            value={p.agentId}
                            onChange={relink("phone", p.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Status value={p.status} />
                        </TableCell>
                        <TableCell className="num">{formatNumber(p.callsToday)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageCircle className="size-4" aria-hidden /> {t("whatsapp")}
            </h2>
            <p className="text-muted-foreground text-sm">{t("whatsappHint")}</p>
          </div>
          <Can permission="agents.manage">
            <Button variant="outline" onClick={() => setAdding("whatsapp")}>
              <Plus aria-hidden /> {t("addWhatsApp")}
            </Button>
          </Can>
        </div>
        <DataState
          state={whatsapp}
          isEmpty={(d) => d.length === 0}
          loading={
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          }
          empty={
            <EmptyState
              icon={MessageCircle}
              title={t("noWhatsApp")}
              description={t("noWhatsAppBody")}
            />
          }
        >
          {(rows: WhatsAppNumber[]) => (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((w) => (
                <Card key={w.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      <span className="bg-wa-green/15 text-wa-teal flex size-10 items-center justify-center rounded-full">
                        <MessageCircle className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{w.displayName}</p>
                        <p className="num text-muted-foreground text-sm" dir="ltr">
                          <span className="block text-start rtl:text-end">+{w.number}</span>
                        </p>
                      </div>
                      <Status value={w.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-muted-foreground text-[11px]">{t("quality")}</p>
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          <span className="flex gap-0.5" aria-hidden>
                            {(["low", "medium", "high"] as const).map((q, i) => (
                              <span
                                key={q}
                                className={cn(
                                  "h-3 w-1.5 rounded-sm",
                                  i <= ["low", "medium", "high"].indexOf(w.quality)
                                    ? qualityTone[w.quality]
                                    : "bg-muted-foreground/20",
                                )}
                              />
                            ))}
                          </span>
                          {t(`qualities.${w.quality}`)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-muted-foreground text-[11px]">{t("dailyLimit")}</p>
                        <p className="num text-sm font-medium">{formatNumber(w.dailyLimit)}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs">
                        {t("templates", { count: w.templates.length })}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {w.templates.length ? (
                          w.templates.map((tp) => (
                            <span
                              key={tp}
                              className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]"
                              dir="ltr"
                            >
                              {tp}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("noTemplates")}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t pt-3">
                      <p className="text-muted-foreground text-xs">{t("cols.agent")}</p>
                      <LinkedAgent
                        agents={list}
                        value={w.agentId}
                        onChange={relink("whatsapp", w.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DataState>
      </div>
      <SocialChannels agents={list} />
      {list.length ? (
        <AddNumberDialog
          kind={adding ?? "phone"}
          open={adding !== null}
          onOpenChange={(o) => !o && setAdding(null)}
          agents={list}
        />
      ) : null}
    </div>
  );
}
