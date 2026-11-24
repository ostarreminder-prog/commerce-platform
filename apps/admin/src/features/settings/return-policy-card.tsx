"use client";

import * as React from "react";
import { RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProductList, useReturnPolicy, useSaveReturnPolicy } from "@repo/api-client";
import type { Product, ReturnReason } from "@repo/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { EntityLink } from "@/components/entity/entity-link";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { ProductPicker } from "@/components/product-picker";
import { Field, SaveFooter } from "./settings-fields";

const REASONS: ReturnReason[] = ["damaged", "wrong_item", "not_as_described", "size_issue", "changed_mind", "other"];

/** Return policy (SCREENS_SPEC §5.4): window days, enabled reasons,
 * non-returnable products, allowed resolutions. Enforced in returns.create
 * eligibility on the mock server. Lives under /settings/shipping. */
export function ReturnPolicyCard() {
  const t = useTranslations("settings.returnPolicy");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const policy = useReturnPolicy();
  const save = useSaveReturnPolicy();
  const products = useProductList();
  const [windowDays, setWindowDays] = React.useState<string | null>(null);
  const p = policy.data;
  const productMap = React.useMemo(() => new Map((products.data ?? []).map((x) => [x.id, x])), [products.data]);
  if (policy.isPending || !p) return <Skeleton className="h-72 w-full" />;
  const persist = (patch: Partial<typeof p>) =>
    save.mutate([patch], { onSuccess: () => toast.success(t("saved")), onError: () => toast.error(t("saveFailed")) });
  const toggleReason = (r: ReturnReason, on: boolean) =>
    persist({ reasons: on ? [...p.reasons, r] : p.reasons.filter((x) => x !== r) });
  const addNonReturnable = (product: Product) => {
    if (p.nonReturnableProductIds.includes(product.id)) return;
    persist({ nonReturnableProductIds: [...p.nonReturnableProductIds, product.id] });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><RotateCcw className="size-4" aria-hidden />{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field
          id="rp-window" label={t("windowDays")}
          defaultValue={String(windowDays ?? p.windowDays)} dir="ltr" className="num text-start sm:max-w-40" inputMode="numeric"
          onChange={(e) => setWindowDays(e.target.value)}
        />
        <div className="space-y-2">
          <Label>{t("reasons")}</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <Checkbox id={`rp-r-${r}`} checked={p.reasons.includes(r)} onCheckedChange={(v) => toggleReason(r, v === true)} />
                <Label htmlFor={`rp-r-${r}`} className="font-normal">{ts(`returnReasons.${r}`)}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("nonReturnable")}</Label>
          <ProductPicker onAdd={(product) => addNonReturnable(product)} />
          {p.nonReturnableProductIds.length ? (
            <ul className="divide-y rounded-md border">
              {p.nonReturnableProductIds.map((id) => {
                const product = productMap.get(id);
                return (
                <li key={id} className="flex items-center justify-between gap-3 p-2.5 text-sm">
                  {product ? <EntityLink type="product" id={id} label={product.name[locale] ?? product.name.ar} /> : id}
                  <button
                    type="button" aria-label={t("removeNonReturnable")}
                    className="hover:text-destructive rounded-sm"
                    onClick={() => persist({ nonReturnableProductIds: p.nonReturnableProductIds.filter((x) => x !== id) })}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
                );
              })}
            </ul>
          ) : <p className="text-muted-foreground text-sm">{t("noNonReturnable")}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <Label htmlFor="rp-exchange" className="font-normal">{t("allowExchange")}</Label>
            <Switch id="rp-exchange" checked={p.allowExchange} onCheckedChange={(v) => persist({ allowExchange: v })} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <Label htmlFor="rp-credit" className="font-normal">{t("allowStoreCredit")}</Label>
            <Switch id="rp-credit" checked={p.allowStoreCredit} onCheckedChange={(v) => persist({ allowStoreCredit: v })} />
          </div>
        </div>
        <SaveFooter pending={save.isPending} onSave={() => persist({ windowDays: Math.max(1, Number(windowDays ?? p.windowDays) || p.windowDays) })} />
      </CardContent>
    </Card>
  );
}
