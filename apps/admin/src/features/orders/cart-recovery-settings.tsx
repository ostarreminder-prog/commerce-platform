"use client";

import { useTranslations } from "next-intl";
import { useAgents, useCartRecoverySettings, useCouponList, useSaveCartRecoverySettings } from "@repo/api-client";
import { Card, CardContent } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";

export function RecoverySettings() {
  const t = useTranslations("sales.carts.settings");
  const settings = useCartRecoverySettings();
  const save = useSaveCartRecoverySettings();
  const agents = useAgents();
  const coupons = useCouponList();
  const canManage = useCan("marketing.manage");
  const s = settings.data;
  if (!s) return <Skeleton className="h-24" />;
  const update = (patch: Partial<typeof s>) => save.mutate([{ ...s, ...patch }], { onSuccess: () => toast.success(t("saved")) });
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
        <div className="flex items-center justify-between gap-3 rounded-md border p-3 lg:h-10 lg:py-0">
          <Label htmlFor="auto-recovery" className="font-normal">{t("auto")}</Label>
          <Switch id="auto-recovery" checked={s.autoRecovery} disabled={!canManage} onCheckedChange={(v) => update({ autoRecovery: v })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rec-delay">{t("delay")}</Label>
          <Select value={s.delay} disabled={!canManage || !s.autoRecovery} onValueChange={(v) => update({ delay: v as typeof s.delay })}>
            <SelectTrigger id="rec-delay"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1h">{t("after1h")}</SelectItem><SelectItem value="24h">{t("after24h")}</SelectItem></SelectContent>
          </Select>
        </div>
        {/* Second reminder (§5.6 timing config) — sent if still abandoned after
         * the first touch; "off" disables it. */}
        <div className="space-y-1.5">
          <Label htmlFor="rec-reminder2">{t("secondReminder")}</Label>
          <Select value={s.secondReminder ?? "off"} disabled={!canManage || !s.autoRecovery} onValueChange={(v) => update({ secondReminder: v === "off" ? null : v as "24h" | "48h" })}>
            <SelectTrigger id="rec-reminder2"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="off">{t("reminderOff")}</SelectItem><SelectItem value="24h">{t("after24h")}</SelectItem><SelectItem value="48h">{t("after48h")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rec-agent" className="flex items-center justify-between gap-2">{t("agent")}<EntityLink type="agent" id={s.agentId} className="text-xs" /></Label>
          <Select value={s.agentId} disabled={!canManage} onValueChange={(v) => update({ agentId: v })}>
            <SelectTrigger id="rec-agent"><SelectValue /></SelectTrigger>
            <SelectContent>{(agents.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rec-coupon" className="flex items-center justify-between gap-2">{t("coupon")}{s.couponId ? <EntityLink type="coupon" id={s.couponId} label={coupons.data?.find((c) => c.id === s.couponId)?.code} className="num text-xs" /> : null}</Label>
          <Select value={s.couponId ?? "none"} disabled={!canManage} onValueChange={(v) => update({ couponId: v === "none" ? null : v })}>
            <SelectTrigger id="rec-coupon"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noCoupon")}</SelectItem>
              {(coupons.data ?? []).filter((c) => c.status === "active").map((c) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Exclusion rules — enforced in sendRecovery on the mock server. */}
        <div className="space-y-1.5">
          <Label htmlFor="rec-exclude-days">{t("excludeRecentOrders")}</Label>
          <Select value={String(s.excludeRecentOrdersDays)} disabled={!canManage} onValueChange={(v) => update({ excludeRecentOrdersDays: Number(v) })}>
            <SelectTrigger id="rec-exclude-days"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[0, 1, 3, 7, 14].map((d) => <SelectItem key={d} value={String(d)}>{t("excludeDays", { n: d })}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border p-3 lg:h-10 lg:py-0">
          <Label htmlFor="rec-optout" className="font-normal">{t("excludeOptedOut")}</Label>
          <Switch id="rec-optout" checked={s.excludeOptedOut} disabled={!canManage} onCheckedChange={(v) => update({ excludeOptedOut: v })} />
        </div>
      </CardContent>
    </Card>
  );
}
