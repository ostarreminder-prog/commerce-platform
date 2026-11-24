"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { isPreviewable, useAgents, useEntityRecord, type PreviewableEntity } from "@repo/api-client";
import type { EntityType, Permission } from "@repo/contracts";
import { Popover, PopoverAnchor, PopoverContent } from "@repo/ui/components/popover";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import Link from "@/components/store-link";
import { usePermissions } from "@/lib/permissions";
import { EntityPreview } from "./entity-preview";

export const entityHref: Record<EntityType, (id: string) => string> = {
  order: (id) => `/orders/${id}`,
  customer: (id) => `/customers/${id}`,
  product: (id) => `/products/${id}`,
  brand: (id) => `/brands?id=${id}`,
  variant: (id) => `/inventory/${id}`,
  category: (id) => `/categories?id=${id}`,
  collection: (id) => `/collections/${id}`,
  conversation: (id) => `/inbox/${id}`,
  agent: (id) => `/agents/${id}`,
  shipment: (id) => `/shipments/${id}`,
  invoice: (id) => `/invoices/${id}`,
  return: (id) => `/returns/${id}`,
  coupon: (id) => `/marketing/coupons/${id}`,
  abandonedCart: (id) => `/abandoned-carts/${id}`,
  staff: (id) => `/settings/staff?id=${id}`,
  role: (id) => `/settings/roles?id=${id}`,
  app: (id) => `/apps/store/${id}`,
  installation: (id) => `/apps/${id}`,
  knowledge: (id) => `/knowledge/${id}`,
  approval: (id) => `/approvals?id=${id}`,
  import: (id) => `/imports/${id}`,
  page: (id) => `/storefront/pages/${id}`,
};

const readPermission: Record<EntityType, Permission> = {
  order: "orders.read", shipment: "orders.read", return: "orders.read", abandonedCart: "orders.read",
  customer: "customers.read", product: "products.read", variant: "products.read", brand: "products.read", category: "products.read", collection: "products.read",
  conversation: "conversations.read", approval: "conversations.read", agent: "agents.read", knowledge: "agents.read",
  invoice: "invoices.read", coupon: "marketing.manage", staff: "staff.manage", role: "staff.manage",
  app: "apps.manage", installation: "apps.manage", import: "products.manage", page: "storefront.manage",
};

function useEntityLabel(type: EntityType, id: string, explicit: string | undefined) {
  const { locale } = useAppLocale();
  const previewable = isPreviewable(type);
  const rec = useEntityRecord((previewable ? type : "order") as PreviewableEntity, id, previewable && !explicit);
  const agents = useAgents();
  if (explicit) return explicit;
  if (type === "agent") return agents.data?.find((a) => a.id === id)?.name ?? id;
  const r = rec.data as Record<string, unknown> | null | undefined;
  if (!r) return rec.isPending ? "…" : id;
  const loc = (v: unknown) => (v && typeof v === "object" ? ((v as Record<string, string>)[locale] ?? (v as Record<string, string>).ar) : String(v));
  switch (type) {
    case "order":
    case "return":
      return `#${r.number as number}`;
    case "customer":
      return (r.name as string | null) ?? (r.phone as string);
    case "product":
    case "category":
      return loc(r.name);
    case "conversation":
      return ((r.contact as { name: string | null; phone: string }).name ?? (r.contact as { phone: string }).phone) as string;
    case "shipment":
      return (r.trackingNumber as string | null) ?? id;
    case "invoice":
      return r.number as string;
    case "abandonedCart":
      return `#${id.replace("cart_", "")}`;
    case "staff":
      return r.name as string;
    default:
      return id;
  }
}

/**
 * Every entity reference goes through here (SCREENS_SPEC §1.1, §1.2, §1.14):
 * store-scoped link, hover/Shift+click quick preview, plain text without read permission.
 */
export function EntityLink({ type, id, label, className, children }: { type: EntityType; id: string; label?: string; className?: string; children?: React.ReactNode }) {
  const t = useTranslations("entity");
  const { can } = usePermissions();
  const text = useEntityLabel(type, id, label);
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasPreview = isPreviewable(type) || type === "agent";
  const content = children ?? <bdi>{text}</bdi>;

  if (!can(readPermission[type])) return <span className={className}>{content}</span>;

  const schedule = (next: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), ms);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Link
          href={entityHref[type](id)}
          className={cn("text-primary font-medium underline-offset-4 hover:underline", className)}
          aria-describedby={open ? `preview-${type}-${id}` : undefined}
          onMouseEnter={hasPreview ? () => schedule(true, 450) : undefined}
          onMouseLeave={hasPreview ? () => schedule(false, 200) : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (e.shiftKey && hasPreview) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          title={hasPreview ? t("previewHint") : undefined}
        >
          {content}
        </Link>
      </PopoverAnchor>
      {hasPreview ? (
        <PopoverContent
          id={`preview-${type}-${id}`}
          className="w-72 p-0"
          align="start"
          onMouseEnter={() => clearTimeout(timer.current)}
          onMouseLeave={() => schedule(false, 200)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <EntityPreview type={type} id={id} />
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
