"use client";

import { useTranslations } from "next-intl";
import { Card } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import type { Row } from "@/features/catalog/products-shared";

/** List-head summary strip — status counts plus the low/out-of-stock alert. */
export function ProductsSummary({ rows }: { rows: Row[] }) {
  const t = useTranslations("catalog.products");
  const items = [
    ["total", rows.length, false],
    ["active", rows.filter((r) => r.product.status === "active").length, false],
    ["draft", rows.filter((r) => r.product.status === "draft").length, false],
    ["archived", rows.filter((r) => r.product.status === "archived").length, false],
    ["lowOut", rows.filter((r) => r.stock.low || r.stock.out).length, true],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map(([key, value, warn]) => (
        <Card key={key}>
          <div className="p-3">
            <p className="text-muted-foreground text-xs">{t(`summary.${key}`)}</p>
            <p className={cn("num mt-1 text-lg font-semibold", warn && value > 0 && "text-warning")}>{formatNumber(value)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
