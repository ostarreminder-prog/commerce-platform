"use client";

import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { ORDER_CHANNELS, useAgents } from "@repo/api-client";
import { SAUDI_CITIES } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { DEFAULTS, METHODS, MORE_KEYS, type Filters } from "./orders-utils";

export function MoreFilters({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const t = useTranslations("sales.orders.filters");
  const tc = useTranslations("sales");
  const tch = useTranslations("channels");
  const agents = useAgents();
  const active = MORE_KEYS.filter((k) => f[k] !== DEFAULTS[k]).length;
  const sel = (key: "method" | "channel" | "agent" | "city", options: { value: string; label: string }[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${key}`}>{t(key)}</Label>
      <Select value={f[key]} onValueChange={(v) => set({ [key]: v })}>
        <SelectTrigger id={`f-${key}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("any")}</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter aria-hidden />
          {t("more")}
          {active ? <Badge className="num ms-1 px-1.5">{active}</Badge> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        {sel("method", METHODS.map((m) => ({ value: m, label: tc(`paymentMethods.${m}`) })))}
        {sel("channel", ORDER_CHANNELS.map((c) => ({ value: c, label: tch(c) })))}
        {sel("agent", (agents.data ?? []).map((a) => ({ value: a.id, label: a.name })))}
        {sel("city", SAUDI_CITIES.map((c) => ({ value: c, label: c })))}
        <div className="space-y-1.5">
          <Label>{t("amount")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" placeholder={t("from")} aria-label={t("from")} value={f.min} onChange={(e) => set({ min: e.target.value })} />
            <Input inputMode="decimal" placeholder={t("to")} aria-label={t("to")} value={f.max} onChange={(e) => set({ max: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-coupon">{t("coupon")}</Label>
            <Input id="f-coupon" dir="ltr" value={f.coupon} onChange={(e) => set({ coupon: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-tag">{t("tag")}</Label>
            <Input id="f-tag" value={f.tag} onChange={(e) => set({ tag: e.target.value })} />
          </div>
        </div>
        {active ? (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => set(Object.fromEntries(MORE_KEYS.map((k) => [k, DEFAULTS[k]])))}>
            {t("clearMore")}
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
