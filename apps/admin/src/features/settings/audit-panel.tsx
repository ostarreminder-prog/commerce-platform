"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuditLog, useStaffList } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";

const RANGES = ["all", "today", "week", "month"] as const;
const KNOWN_ACTIONS = ["app.installed", "app.uninstalled", "shipment.created", "order.paid", "reports.synced", "product.updated", "staff.invited", "settings.updated"] as const;

/** Audit log — time/actor/action/target/changes + actor/type/period filters (spec §5.24). */
export function AuditPanel() {
  const t = useTranslations("settings");
  const ta = useTranslations("actor");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data, isPending } = useAuditLog();
  const { data: staff } = useStaffList();
  const [actor, setActor] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [range, setRange] = React.useState<(typeof RANGES)[number]>("all");
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const types = [...new Set(data.map((a) => a.action.split(".")[0] ?? a.action))];
  const cutoff = { all: 0, today: 1, week: 7, month: 30 }[range];
  const rows = data.filter(
    (a) =>
      (actor === "all" || a.actor.id === actor) &&
      (type === "all" || a.action.startsWith(`${type}.`)) &&
      (cutoff === 0 || Date.now() - +new Date(a.at) <= cutoff * 86_400_000),
  );
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{t("nav.audit")}</CardTitle>
          <CardDescription>{t("audit.hint")}</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => mt.success("audit.exported")}>
          <Download aria-hidden /> {t("audit.export")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger className="w-44" aria-label={t("audit.filters.actor")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("audit.filters.allActors")}</SelectItem>
              {(staff ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44" aria-label={t("audit.filters.type")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("audit.filters.allTypes")}</SelectItem>
              {types.map((x) => (
                <SelectItem key={x} value={x}>
                  {t(`audit.types.${x}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v as (typeof RANGES)[number])}>
            <SelectTrigger className="w-36" aria-label={t("audit.filters.range")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`audit.ranges.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("audit.cols.time")}</TableHead>
              <TableHead>{t("audit.cols.actor")}</TableHead>
              <TableHead>{t("audit.cols.action")}</TableHead>
              <TableHead>{t("audit.cols.target")}</TableHead>
              <TableHead>{t("audit.cols.changes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap text-sm">{formatDateTime(new Date(a.at), locale)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{ta(a.actor.type === "staff" ? "staff" : a.actor.type === "app" ? "app" : "system")}</Badge>
                    {a.actor.name}
                  </span>
                </TableCell>
                <TableCell>{KNOWN_ACTIONS.includes(a.action as (typeof KNOWN_ACTIONS)[number]) ? t(`audit.actions.${a.action as (typeof KNOWN_ACTIONS)[number]}` as never) : a.action}</TableCell>
                <TableCell>{a.target ? <EntityLink type={a.target.type} id={a.target.id} label={a.target.label} /> : "—"}</TableCell>
                <TableCell>
                  {a.changes.length === 0
                    ? "—"
                    : a.changes.map((c) => (
                        <span key={c.field} className="me-2 inline-block text-xs">
                          <span className="font-medium">{c.field}</span>: <span className="text-muted-foreground line-through">{c.from ?? "—"}</span>{" "}
                          <span className="num">{c.to ?? "—"}</span>
                        </span>
                      ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
