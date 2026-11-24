"use client";

import * as React from "react";
import {
  useCategoryList,
  useCollectionList,
  useCouponList,
  useCustomerList,
  useOrderList,
  useProductList,
} from "@repo/api-client";
import type { EntityType } from "@repo/contracts";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import type { CopilotEntityRef } from "./types";

export interface RefItem {
  id: string;
  label: string;
  hint?: string;
}

/** Entity types offered by the `/` trigger menu. */
export const SLASH_TYPES: EntityType[] = ["product", "category", "order", "customer", "collection", "coupon"];

const TOKEN_PREFIX: Record<string, string> = {
  order: "#",
  customer: "@",
};

export const refToken = (type: EntityType, id: string) => `${TOKEN_PREFIX[type] ?? "/"}${id}`;

const norm = (s: string) => s.toLowerCase().trim();
const matches = (item: RefItem, query: string) =>
  !query ||
  norm(item.label).includes(norm(query)) ||
  norm(item.hint ?? "").includes(norm(query)) ||
  norm(item.id).includes(norm(query));

/** Unified items list for the active trigger type (filtered by the typed query). */
function useRefItems(type: EntityType, query: string): RefItem[] {
  const { locale } = useAppLocale();
  const { data: orders } = useOrderList();
  const { data: customers } = useCustomerList();
  const { data: products } = useProductList();
  const { data: categories } = useCategoryList();
  const { data: collections } = useCollectionList();
  const { data: coupons } = useCouponList();

  return React.useMemo(() => {
    const loc = (v: { ar: string; en?: string }) => (locale === "en" && v.en) || v.ar;
    let items: RefItem[] = [];
    switch (type) {
      case "order":
        items = (orders ?? []).slice(0, 10).map((o) => ({
          id: o.id,
          label: `#${o.number}`,
          hint: customers?.find((c) => c.id === o.customerId)?.name ?? "",
        }));
        break;
      case "customer":
        items = (customers ?? []).slice(0, 10).map((c) => ({ id: c.id, label: c.name ?? c.phone, hint: c.phone }));
        break;
      case "product":
        items = (products ?? []).slice(0, 10).map((p) => ({ id: p.id, label: loc(p.name), hint: p.variants[0]?.sku }));
        break;
      case "category":
        items = (categories ?? []).map((c) => ({ id: c.id, label: loc(c.name) }));
        break;
      case "collection":
        items = (collections ?? []).map((c) => ({ id: c.id, label: loc(c.name) }));
        break;
      case "coupon":
        items = (coupons ?? []).map((c) => ({ id: c.id, label: c.code }));
        break;
      default:
        items = [];
    }
    return items.filter((i) => matches(i, query)).slice(0, 8);
  }, [type, query, orders, customers, products, categories, collections, coupons, locale]);
}

/**
 * Popover list for `#` / `@` / `/` composer triggers. `/` first shows the
 * entity-type picker (`slashType === null`), then the items of the picked type.
 */
export function EntityRefMenu({
  type,
  slashType,
  query,
  onPickType,
  onPick,
}: {
  /** Fixed type from #/@ triggers; `null` while the `/` trigger picks a type. */
  type: EntityType | null;
  slashType: EntityType | null;
  query: string;
  onPickType: (type: EntityType) => void;
  onPick: (ref: CopilotEntityRef) => void;
}) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const effectiveType = type ?? slashType;
  const items = useRefItems(effectiveType ?? "product", query);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => setIndex(0), [query, effectiveType]);

  const pickingType = effectiveType === null;
  const rowClass = (i: number) =>
    cn("flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-start text-sm", i === index && "bg-accent");

  return (
    <div className="max-h-56 overflow-y-auto p-1" role="listbox">
      {pickingType ? (
        <>
          <p className="text-muted-foreground px-2 py-1 text-xs">{t("copilot.refs.pickType")}</p>
          {SLASH_TYPES.map((entityType, i) => (
            <button key={entityType} type="button" className={rowClass(i)} onClick={() => onPickType(entityType)}>
              {t(`copilot.refs.${entityType}`)}
            </button>
          ))}
        </>
      ) : items.length ? (
        items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={rowClass(i)}
            onClick={() => onPick({ type: effectiveType, id: item.id, label: item.label, token: refToken(effectiveType, item.id) })}
          >
            <span className="truncate">{item.label}</span>
            {item.hint ? <span className="text-muted-foreground num shrink-0 text-xs">{item.hint}</span> : null}
          </button>
        ))
      ) : (
        <p className="text-muted-foreground px-2 py-1.5 text-xs">{t("copilot.refs.pickType")}</p>
      )}
    </div>
  );
}
