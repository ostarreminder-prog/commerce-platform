"use client";

import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBrandList } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import type { Filters } from "@/features/catalog/products-shared";

export function MoreFilters({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const t = useTranslations("catalog.products.filters");
  const brands = useBrandList();
  const keys = ["tag", "brand", "min", "max"] as const;
  const active = keys.filter((k) => f[k]).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline"><Filter aria-hidden />{t("more")}{active ? <Badge className="num ms-1 px-1.5">{active}</Badge> : null}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-tag">{t("tag")}</Label>
            <Input id="f-tag" value={f.tag} onChange={(e) => set({ tag: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("brand")}</Label>
            <Select value={f.brand || "all"} onValueChange={(v) => set({ brand: v === "all" ? "" : v })}>
              <SelectTrigger aria-label={t("brand")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allBrands")}</SelectItem>
                {/* Managed brands first; any stray free-text brand on products stays selectable via its own entry. */}
                {(brands.data ?? []).filter((b) => b.status === "active").map((b) => (
                  <SelectItem key={b.id} value={b.name.ar}>{b.name.ar}</SelectItem>
                ))}
                {f.brand && !(brands.data ?? []).some((b) => b.name.ar === f.brand) ? (
                  <SelectItem value={f.brand}>{f.brand}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("price")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" placeholder={t("from")} aria-label={t("from")} value={f.min} onChange={(e) => set({ min: e.target.value })} />
            <Input inputMode="decimal" placeholder={t("to")} aria-label={t("to")} value={f.max} onChange={(e) => set({ max: e.target.value })} />
          </div>
        </div>
        {active ? <Button variant="ghost" size="sm" className="w-full" onClick={() => set({ tag: "", brand: "", min: "", max: "" })}>{t("clearMore")}</Button> : null}
      </PopoverContent>
    </Popover>
  );
}
