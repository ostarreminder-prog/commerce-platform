"use client";

import { FileText, Percent, Receipt, ShoppingBag, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCustomerList, useOrderList, useProductList } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { StatCard } from "@repo/ui/components/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { SalesChart } from "@/features/dashboard/sales-chart";
import { BreakdownCard, type BreakdownRow } from "./breakdown-card";
import { dailySeries, delta, inRange, sellable } from "./report-data";

function RowLink({ type, id, label }: { type: "order" | "product" | "customer" | "agent" | "coupon" | "invoice"; id: string; label?: string }) {
  return <EntityLink type={type} id={id} label={label} />;
}

export function SalesBody({ days, compare }: { days: number; compare: boolean }) {
  const t = useTranslations("reports");
  const tch = useTranslations("channels");
  const { locale } = useAppLocale();
  const { data: orders = [] } = useOrderList();
  const cur = orders.filter((o) => sellable(o) && inRange(o.createdAt, days));
  const prev = orders.filter((o) => sellable(o) && inRange(o.createdAt, days, days));
  const sum = (l: Order[]) => l.reduce((s, o) => s + o.total.amount, 0);
  const d = (c: number, p: number) => (compare ? delta(c, p) : undefined);
  const group = (key: (o: Order) => string): BreakdownRow[] => {
    const m = new Map<string, number>();
    cur.forEach((o) => m.set(key(o), (m.get(key(o)) ?? 0) + o.total.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: tch(k as "storefront"), value: v }));
  };
  const cities = new Map<string, number>();
  cur.forEach((o) => cities.set(o.shippingAddress.city, (cities.get(o.shippingAddress.city) ?? 0) + 1));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("kpi.revenue")} value={formatMoney(sum(cur), locale)} delta={d(sum(cur), sum(prev))} icon={Receipt} />
        <StatCard label={t("kpi.orders")} value={formatNumber(cur.length)} delta={d(cur.length, prev.length)} icon={ShoppingBag} />
        <StatCard label={t("kpi.aov")} value={formatMoney(cur.length ? Math.round(sum(cur) / cur.length) : 0, locale)} icon={Percent} />
        <StatCard label={t("kpi.tax")} value={formatMoney(cur.reduce((s, o) => s + o.taxTotal.amount, 0), locale)} icon={FileText} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("revenueTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="h-72 ps-0">
          <SalesChart data={dailySeries(orders, days)} metric="revenue" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <BreakdownCard title={t("channelsTitle")} rows={group((o) => o.channel)} />
        <BreakdownCard
          title={t("citiesTitle")}
          money={false}
          rows={[...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ key: k, label: k, value: v }))}
        />
      </div>
    </div>
  );
}

export function ProductsBody() {
  const t = useTranslations("reports");
  const { locale } = useAppLocale();
  const { data: products = [] } = useProductList();
  const { data: orders = [] } = useOrderList();
  const returned = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((i) => returned.set(i.productId, (returned.get(i.productId) ?? 0) + i.returnedQty)));
  const top = [...products].sort((a, b) => b.stats.revenue30d.amount - a.stats.revenue30d.amount).slice(0, 8);
  const mostReturned = [...products].map((p) => ({ p, qty: returned.get(p.id) ?? 0 })).filter((x) => x.qty > 0).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const mostAsked = [...products].sort((a, b) => b.stats.conversations30d - a.stats.conversations30d).slice(0, 5);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("products.topSelling")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("products.product")}</TableHead>
                <TableHead>{t("products.sold")}</TableHead>
                <TableHead>{t("products.revenue")}</TableHead>
                <TableHead>{t("products.asked")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><RowLink type="product" id={p.id} label={p.name[locale] ?? p.name.ar} /></TableCell>
                  <TableCell className="num">{formatNumber(p.stats.sold30d)}</TableCell>
                  <TableCell className="num">{formatMoney(p.stats.revenue30d.amount, locale)}</TableCell>
                  <TableCell className="num">{formatNumber(p.stats.conversations30d)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <BreakdownCard title={t("products.topReturned")} money={false} rows={mostReturned.map((x) => ({ key: x.p.id, label: <RowLink type="product" id={x.p.id} label={x.p.name[locale] ?? x.p.name.ar} />, value: x.qty }))} />
        <BreakdownCard title={t("products.topAsked")} money={false} rows={mostAsked.map((p) => ({ key: p.id, label: <RowLink type="product" id={p.id} label={p.name[locale] ?? p.name.ar} />, value: p.stats.conversations30d }))} />
      </div>
    </div>
  );
}

export function CustomersBody({ days }: { days: number }) {
  const t = useTranslations("reports");
  const { data: customers = [] } = useCustomerList();
  const segs = new Map<string, { count: number; spent: number }>();
  customers.forEach((c) => {
    const s = segs.get(c.segment) ?? { count: 0, spent: 0 };
    s.count += 1;
    s.spent += c.stats.totalSpent.amount;
    segs.set(c.segment, s);
  });
  const fresh = customers.filter((c) => c.createdAt && inRange(c.createdAt, days));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("customers.total")} value={formatNumber(customers.length)} icon={Users} />
        <StatCard label={t("customers.newInPeriod")} value={formatNumber(fresh.length)} icon={Users} />
        <StatCard label={t("customers.returning")} value={formatNumber(customers.filter((c) => c.segment === "returning" || c.segment === "vip").length)} icon={Users} />
        <StatCard label={t("customers.atRisk")} value={formatNumber(customers.filter((c) => c.segment === "at_risk").length)} icon={Users} />
      </div>
      <BreakdownCard
        title={t("customers.segments")}
        rows={[...segs.entries()].sort((a, b) => b[1].spent - a[1].spent).map(([k, v]) => ({ key: k, label: `${t(`customers.segment.${k as "new"}`)} · ${formatNumber(v.count)}`, value: v.spent }))}
      />
    </div>
  );
}
