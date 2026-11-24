"use client";

import { useTranslations } from "next-intl";
import type { Variant } from "@repo/contracts";
import type { StoreProduct } from "@/lib/store-product";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";

/** Specs table — SKU / barcode / weight / dimensions per selected variant +
 * brand & tags from the product record. */
export function ProductSpecs({ product: p, variant }: { product: StoreProduct; variant: Variant | null }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const v = variant ?? p.product.variants[0];
  const dims = v?.dimensionsCm;
  const rows: [string, string][] = [
    [t("specs.sku"), v?.sku ?? p.sku],
    ...(v?.barcode ? [[t("specs.barcode"), v.barcode] as [string, string]] : []),
    ...(v?.weightGrams ? [[t("specs.weight"), t("specs.weightValue", { kg: formatNumber(v.weightGrams / 1000, { maximumFractionDigits: 2 }) })] as [string, string]] : []),
    ...(dims ? [[t("specs.dimensions"), `${formatNumber(dims.l)} × ${formatNumber(dims.w)} × ${formatNumber(dims.h)} سم`] as [string, string]] : []),
    ...(p.product.brand ? [[t("specs.brand"), p.product.brand] as [string, string]] : []),
    [t("specs.type"), t(`specs.typeValue.${p.product.type}`)],
    ...(p.product.tags.length ? [[t("specs.tags"), p.product.tags.join("، ")] as [string, string]] : []),
  ];
  void locale;
  return (
    <dl className="divide-y rounded-xl border text-sm">
      {rows.map(([k, val]) => (
        <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="num font-medium" dir="auto">
            {val}
          </dd>
        </div>
      ))}
    </dl>
  );
}
