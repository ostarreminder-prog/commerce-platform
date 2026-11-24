"use client";

import * as React from "react";
import Link from "@/components/store-link";
import { CheckCircle2, Clock, PackageCheck, Printer, Settings2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderList, useSetOrderFulfillment, useShipmentList } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard } from "@repo/ui/components/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { StatusBadge } from "@repo/ui/components/status-badge";

type Tab = "toShip" | "inTransit" | "delivered";
type CarrierId = "smsa" | "aramex" | "spl" | "redbox";
const CARRIERS: { id: CarrierId; connected: boolean; rate: number; hue: number }[] = [
  { id: "smsa", connected: true, rate: 2500, hue: 205 },
  { id: "aramex", connected: true, rate: 2900, hue: 0 },
  { id: "spl", connected: true, rate: 1900, hue: 145 },
  { id: "redbox", connected: false, rate: 1500, hue: 350 },
];
const inTab = (o: Order, tab: Tab) =>
  tab === "toShip"
    ? o.fulfillmentStatus === "unfulfilled" || o.fulfillmentStatus === "processing"
    : tab === "inTransit"
      ? o.fulfillmentStatus === "shipped"
      : o.fulfillmentStatus === "delivered";

function RowAction({ order }: { order: Order }) {
  const t = useTranslations("shipping");
  const update = useSetOrderFulfillment();
  if (order.fulfillmentStatus === "unfulfilled" || order.fulfillmentStatus === "processing") {
    return (
      <Button
        size="sm"
        loading={update.isPending}
        onClick={() =>
          update.mutate([[order.id], "shipped"], { onSuccess: () => toast.success(t("created")) })
        }
      >
        <Truck aria-hidden /> {t("createShipment")}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={() => toast.success(t("labelPrinted"))}>
      <Printer aria-hidden /> {t("printLabel")}
    </Button>
  );
}

export function ShippingView() {
  const t = useTranslations("shipping");
  const tc = useTranslations("carrierName");
  const { locale } = useAppLocale();
  const query = useOrderList();
  const { data: shipments = [] } = useShipmentList();
  const [tab, setTab] = React.useState<Tab>("toShip");
  const orders = query.data ?? [];
  const count = (x: Tab) => orders.filter((o) => inTab(o, x)).length;
  const rows = orders.filter((o) => inTab(o, tab));
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="outline">
            <Settings2 aria-hidden /> {t("settings")}
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("summary.toShip")}
          value={formatNumber(count("toShip"))}
          icon={PackageCheck}
        />
        <StatCard
          label={t("summary.inTransit")}
          value={formatNumber(count("inTransit"))}
          icon={Truck}
        />
        <StatCard
          label={t("summary.delivered")}
          value={formatNumber(count("delivered"))}
          icon={CheckCircle2}
        />
        <StatCard
          label={t("summary.avgDays")}
          value={t("days", { count: formatNumber(2.4) })}
          icon={Clock}
        />
      </div>
      <section className="space-y-3">
        <h2 className="font-semibold">{t("carriers")}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARRIERS.map((c) => (
            <Card key={c.id} className={cn(!c.connected && "border-dashed")}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-paper flex size-10 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ backgroundColor: `hsl(${c.hue} 65% 45%)` }}
                    aria-hidden
                  >
                    {tc(c.id).charAt(0)}
                  </span>
                  {c.connected ? (
                    <Badge variant="success">{t("connected")}</Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7">
                      {t("connect")}
                    </Button>
                  )}
                </div>
                <div>
                  <p className="font-medium">{tc(c.id)}</p>
                  <p className="text-muted-foreground text-xs">
                    {c.connected
                      ? t("shipments", {
                          count: formatNumber(orders.filter((o) => o.shippingMethod?.carrier === tc(c.id)).length),
                        })
                      : t("rate", { price: formatMoney(c.rate, locale) })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          {t("freeShipping", { amount: formatMoney(20000, locale) })}
        </p>
      </section>
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="no-scrollbar max-w-full justify-start overflow-x-auto">
              {(["toShip", "inTransit", "delivered"] as const).map((x) => (
                <TabsTrigger key={x} value={x} className="gap-2">
                  {t(`tabs.${x}`)}
                  <span className="num bg-background/60 rounded px-1.5 text-xs">
                    {formatNumber(count(x))}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <CardTitle className="sr-only">{t(`tabs.${tab}`)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataState state={query} loading={<Skeleton className="m-6 h-64" />}>
            {() =>
              rows.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                  className="border-0"
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("col.order")}</TableHead>
                          <TableHead>{t("col.customer")}</TableHead>
                          <TableHead>{t("col.city")}</TableHead>
                          <TableHead>{t("col.carrier")}</TableHead>
                          <TableHead>{t("col.tracking")}</TableHead>
                          <TableHead>{t("col.status")}</TableHead>
                          <TableHead>
                            <span className="sr-only">{t("createShipment")}</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link
                                href={`/orders/${o.id}`}
                                className="num font-semibold hover:underline"
                              >
                                #{o.number}
                              </Link>
                            </TableCell>
                            <TableCell>{o.shippingAddress.recipientName}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {o.shippingAddress.city}
                            </TableCell>
                            <TableCell>{o.shippingMethod?.carrier ?? "—"}</TableCell>
                            <TableCell className="num text-muted-foreground text-xs" dir="ltr">
                              {shipments.find((sh) => sh.orderId === o.id)?.trackingNumber ?? "—"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge entity="order" field="fulfillmentStatus" value={o.fulfillmentStatus} />
                            </TableCell>
                            <TableCell className="text-end">
                              <RowAction order={o} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="divide-y md:hidden">
                    {rows.map((o) => (
                      <li key={o.id} className="space-y-2 p-4">
                        <div className="flex items-center justify-between">
                          <Link href={`/orders/${o.id}`} className="num font-semibold">
                            #{o.number}
                          </Link>
                          <StatusBadge entity="order" field="fulfillmentStatus" value={o.fulfillmentStatus} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {o.shippingAddress.recipientName} · {o.shippingAddress.city} · {o.shippingMethod?.carrier ?? "—"}
                        </p>
                        <RowAction order={o} />
                      </li>
                    ))}
                  </ul>
                </>
              )
            }
          </DataState>
        </CardContent>
      </Card>
    </div>
  );
}
