"use client";

import Link from "next/link";
import { Ban, Building2, CheckCircle2, ExternalLink, LogIn, Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSetTenantStatus } from "@repo/api-client";
import type { Tenant } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { PlanBadge, TenantLogo, TenantStatusBadge } from "@/components/badges";

export function TenantSheet({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const setStatus = useSetTenantStatus();
  return (
    <Sheet open={Boolean(tenant)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {tenant ? (
          <div className="space-y-6">
            <SheetHeader className="text-start">
              <div className="flex items-center gap-3">
                <TenantLogo name={tenant.name} hue={tenant.hue} />
                <div>
                  <SheetTitle>{tenant.name}</SheetTitle>
                  <p className="text-muted-foreground text-sm" dir="ltr">
                    {tenant.domain}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <PlanBadge plan={tenant.plan} />
                <TenantStatusBadge status={tenant.status} />
              </div>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-3">
              {[
                [t("tenants.gmv"), formatMoney(tenant.gmv, locale)],
                [t("tenants.orders"), formatNumber(tenant.orders)],
                [t("tenants.aiConversations"), formatNumber(tenant.aiConversations)],
                [t("tenants.joined"), formatDate(tenant.createdAt, locale)],
              ].map(([k, v]) => (
                <div key={k} className="bg-muted/40 rounded-lg p-3">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="num mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{t("tenants.contact")}</p>
              <p className="flex items-center gap-2">
                <Building2 className="text-muted-foreground size-4" aria-hidden />
                {tenant.ownerName}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="text-muted-foreground size-4" aria-hidden />
                <span dir="ltr">{tenant.ownerEmail}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="text-muted-foreground size-4" aria-hidden />
                {tenant.city}
              </p>
            </div>
            <div className="grid gap-2">
              <Button variant="secondary" asChild>
                <Link href={`/stores/${tenant.id}`}>{t("tenants.openDetails")}</Link>
              </Button>
              <Button onClick={() => toast.info(t("tenants.impersonating", { name: tenant.name }))}>
                <LogIn aria-hidden />
                {t("tenants.impersonate")}
              </Button>
              <Button variant="outline" asChild>
                <a href={`https://${tenant.domain}`} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden />
                  {t("tenants.visit")}
                </a>
              </Button>
              {tenant.status === "suspended" ? (
                <Button
                  variant="outline"
                  loading={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate({ id: tenant.id, status: "active" }, { onSuccess: () => { toast.success(t("tenants.activated", { name: tenant.name })); onClose(); } })
                  }
                >
                  <CheckCircle2 aria-hidden />
                  {t("tenants.activate")}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  loading={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate({ id: tenant.id, status: "suspended" }, { onSuccess: () => { toast.success(t("tenants.suspended", { name: tenant.name })); onClose(); } })
                  }
                >
                  <Ban aria-hidden />
                  {t("tenants.suspend")}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
