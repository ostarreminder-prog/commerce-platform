"use client";

import * as React from "react";
import { Filter, Save, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeleteCustomerSegment, useSaveCustomerSegment, PERIODS } from "@repo/api-client";
import type { SavedCustomerSegment } from "@repo/api-client";
import { SAUDI_CITIES } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { useStatusLabel } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import {
  DEFAULTS, MORE_KEYS, PRESET_SEGMENTS, SEGMENTS, SOURCES, filtersForSegment, presetParam, savedParam, type CustomerFilters,
} from "./customer-filters";

type Set = (patch: Partial<CustomerFilters>, opts?: { resetPage?: boolean }) => void;

export function CustomersToolbar({ f, set, saved, visibleCount }: {
  f: CustomerFilters;
  set: Set;
  saved: SavedCustomerSegment[];
  visibleCount: number;
}) {
  const t = useTranslations("customers");
  const ts = useTranslations("sales");
  const label = useStatusLabel();
  const canManage = useCan("customers.manage");
  const saveSegment = useSaveCustomerSegment();
  const deleteSegment = useDeleteCustomerSegment();
  const [segName, setSegName] = React.useState("");

  const activeMore = MORE_KEYS.filter((k) => f[k] !== DEFAULTS[k]).length;
  const hasFilters = Object.entries(f).some(([k, v]) => v !== DEFAULTS[k as keyof CustomerFilters]);
  const reset = () => set({ ...DEFAULTS });
  const submitSegment = (e: React.FormEvent) => {
    e.preventDefault();
    const name = segName.trim();
    if (!name) return;
    saveSegment.mutate([name, filtersForSegment(f)], {
      onSuccess: () => { toast.success(t("segments.saved", { name })); setSegName(""); },
      onError: () => toast.error(t("segments.saveFailed")),
    });
  };

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select value={f.segment} onValueChange={(v) => set({ segment: v })}>
          <SelectTrigger className="sm:w-44" aria-label={t("filters.segment")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allSegments")}</SelectItem>
            <SelectGroup>
              <SelectLabel>{t("segments.builtin")}</SelectLabel>
              {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{label("customer", "segment", s)}</SelectItem>)}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>{t("segments.presets")}</SelectLabel>
              {PRESET_SEGMENTS.map((k) => <SelectItem key={k} value={presetParam(k)}>{t(`segments.${k}`)}</SelectItem>)}
            </SelectGroup>
            {saved.length ? (
              <SelectGroup>
                <SelectLabel>{t("segments.custom")}</SelectLabel>
                {saved.map((s) => <SelectItem key={s.id} value={savedParam(s.id)}>{s.name}</SelectItem>)}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
        <Select value={f.city} onValueChange={(v) => set({ city: v })}>
          <SelectTrigger className="sm:w-36" aria-label={t("filters.city")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allCities")}</SelectItem>
            {SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.source} onValueChange={(v) => set({ source: v })}>
          <SelectTrigger className="sm:w-36" aria-label={t("filters.source")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allSources")}</SelectItem>
            {SOURCES.map((s) => <SelectItem key={s} value={s}>{t(`sources.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline"><Filter aria-hidden />{t("filters.more")}{activeMore ? <Badge className="num ms-1 px-1.5">{activeMore}</Badge> : null}</Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label htmlFor="cf-tag">{t("filters.tag")}</Label><Input id="cf-tag" value={f.tag} onChange={(e) => set({ tag: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>{t("filters.consent")}</Label>
                <Select value={f.consent} onValueChange={(v) => set({ consent: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.any")}</SelectItem>
                    <SelectItem value="yes">{t("filters.consentYes")}</SelectItem>
                    <SelectItem value="no">{t("filters.consentNo")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="cf-min-o">{t("filters.minOrders")}</Label><Input id="cf-min-o" inputMode="numeric" dir="ltr" className="num" value={f.minOrders} onChange={(e) => set({ minOrders: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>{t("filters.lastOrder")}</Label>
                <Select value={f.period} onValueChange={(v) => set({ period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{ts(`periods.${p}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="cf-min-s">{t("filters.minSpent")}</Label><Input id="cf-min-s" inputMode="decimal" dir="ltr" className="num" value={f.minSpent} onChange={(e) => set({ minSpent: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="cf-max-s">{t("filters.maxSpent")}</Label><Input id="cf-max-s" inputMode="decimal" dir="ltr" className="num" value={f.maxSpent} onChange={(e) => set({ maxSpent: e.target.value })} /></div>
            </div>
            {canManage ? (
              <div className="border-t pt-3">
                <Label className="text-muted-foreground text-xs">{t("segments.title")}</Label>
                <form className="mt-1.5 flex gap-2" onSubmit={submitSegment}>
                  <Input value={segName} onChange={(e) => setSegName(e.target.value)} placeholder={t("segments.namePlaceholder")} aria-label={t("segments.namePlaceholder")} />
                  <Button type="submit" size="sm" variant="secondary" disabled={saveSegment.isPending}><Save aria-hidden />{t("segments.save")}</Button>
                </form>
                <ul className="mt-2 space-y-1">
                  {saved.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{s.name}</span>
                      <button type="button" className="text-muted-foreground hover:text-destructive" aria-label={t("segments.delete")} onClick={() => deleteSegment.mutate([s.id], { onSuccess: () => { if (f.segment === savedParam(s.id)) set({ segment: "all" }); toast.success(t("segments.deleted")); } })}><X className="size-3.5" /></button>
                    </li>
                  ))}
                  {!saved.length ? <li className="text-muted-foreground text-xs">{t("segments.empty")}</li> : null}
                </ul>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
      {hasFilters ? <Button variant="ghost" size="sm" onClick={reset} className="self-start lg:self-auto"><X aria-hidden />{t("resetFilters")}</Button> : null}
      <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: visibleCount })}</span>
    </div>
  );
}
