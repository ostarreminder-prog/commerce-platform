"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, ExternalLink, Mail, MapPin, PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlatformSubscriptions, usePlatformUsage, useTenant, useTenantOrders, useTenantStaff } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatDateTime, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { PlanBadge, TenantLogo, TenantStatusBadge } from "@/components/badges";

const ORDER_VARIANT = { paid: "success", pending: "warning", refunded: "secondary" } as const;

export function StoreDetailView({ id }: { id: string }) {
  const t = useTranslations();
  const { locale, dir } = useAppLocale();
  const tenant = useTenant(id);
  const { data: staff = [] } = useTenantStaff(id);
  const { data: orders = [] } = useTenantOrders(id);
  const { data: usage = [] } = usePlatformUsage();
  const { data: subs = [] } = usePlatformSubscriptions();
  const tn = tenant.data;
  const storeUsage = usage.find((u) => u.tenantId === id);
  const subscription = subs.find((s) => s.tenantId === id);
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (tenant.isPending) return <Skeleton className="h-96" />;
  if (tenant.isError || !tn) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("store.notFound")}
        action={
          <Button variant="outline" asChild>
            <Link href="/tenants">{t("store.back")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/tenants">
          <Back aria-hidden />
          {t("store.back")}
        </Link>
      </Button>
      <div className="flex flex-wrap items-center gap-4">
        <TenantLogo name={tn.name} hue={tn.hue} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{tn.name}</h1>
          <p className="text-muted-foreground text-sm" dir="ltr">
            {tn.domain}
          </p>
        </div>
        <div className="flex gap-2">
          <PlanBadge plan={tn.plan} />
          <TenantStatusBadge status={tn.status} />
          <Button variant="outline" size="sm" asChild>
            <a href={`https://${tn.domain}`} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              {t("tenants.visit")}
            </a>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("store.info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Building2 className="text-muted-foreground size-4" aria-hidden />
              {tn.ownerName}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="text-muted-foreground size-4" aria-hidden />
              <span dir="ltr">{tn.ownerEmail}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="text-muted-foreground size-4" aria-hidden />
              {tn.city}
            </p>
            <dl className="grid grid-cols-2 gap-3 pt-2">
              {[
                [t("tenants.orders"), formatNumber(tn.orders)],
                [t("tenants.gmv"), formatMoney(tn.gmv, locale)],
                [t("tenants.aiConversations"), formatNumber(tn.aiConversations)],
                [t("tenants.joined"), formatDate(tn.createdAt, locale)],
              ].map(([k, v]) => (
                <div key={k} className="bg-muted/40 rounded-lg p-3">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="num mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("store.subscription")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("subscriptions.plan")}</span>
              <PlanBadge plan={tn.plan} />
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("store.mrr")}</span>
              <span className="num font-semibold">{formatMoney(subscription?.mrr ?? 0, locale)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("store.renews")}</span>
              <span className="num">{subscription ? formatDate(subscription.currentPeriodEnd, locale) : "—"}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("store.usage")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(
              [
                [t("store.aiMessages"), storeUsage?.aiMessages],
                [t("store.aiTokens"), storeUsage?.aiTokens],
                [t("store.apiCalls"), storeUsage?.apiCalls],
              ] as [string, number | undefined][]
            ).map(([k, v]) => (
              <p key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="num font-semibold">{v == null ? "—" : formatNumber(v)}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("store.staff")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("team.member")}</TableHead>
                  <TableHead>{t("team.role")}</TableHead>
                  <TableHead>{t("team.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="block font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-xs" dir="ltr">
                        {s.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`role.${s.role}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "success" : s.status === "invited" ? "info" : "destructive"}>
                        {t(`staffStatus.${s.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("store.orders")} <span className="text-muted-foreground text-xs font-normal">{t("store.ordersStub")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="num font-medium">{t("store.orderNumber", { number: formatNumber(o.number) })}</TableCell>
                    <TableCell className="num">{formatMoney(o.total, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={ORDER_VARIANT[o.status]}>{t(`orderStub.${o.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(o.at, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
