"use client";

import { Bot, FileText, Percent, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAbandonedCarts, useAgents, useConversationList, useCouponList, useInvoiceList, useOrderList } from "@repo/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { StatCard } from "@repo/ui/components/stat-card";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { delta, inRange } from "./report-data";

function RowLink({ type, id, label }: { type: "coupon" | "invoice"; id: string; label?: string }) {
  return <EntityLink type={type} id={id} label={label} />;
}

export function AgentsBody() {
  const t = useTranslations("reports");
  const { locale } = useAppLocale();
  const { data: conversations = [] } = useConversationList();
  const { data: orders = [] } = useOrderList();
  const { data: agents = [] } = useAgents();
  const byAgent = new Map<string, { conv: number; resolved: number }>();
  conversations.forEach((c) => {
    const id = c.currentAgentId ?? c.agentPath.at(-1) ?? "";
    const a = byAgent.get(id) ?? { conv: 0, resolved: 0 };
    a.conv += 1;
    if (c.status === "resolved" || c.status === "closed") a.resolved += 1;
    byAgent.set(id, a);
  });
  const revenueByAgent = new Map<string, number>();
  orders.forEach((o) => { if (o.agentId) revenueByAgent.set(o.agentId, (revenueByAgent.get(o.agentId) ?? 0) + o.total.amount); });
  const rows = [...new Set([...byAgent.keys(), ...revenueByAgent.keys()])].filter(Boolean).map((id) => ({
    id,
    name: agents.find((a) => a.id === id)?.name ?? id,
    ...{ conv: byAgent.get(id)?.conv ?? 0, resolved: byAgent.get(id)?.resolved ?? 0, revenue: revenueByAgent.get(id) ?? 0 },
  }));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("agents.table")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("agents.agent")}</TableHead>
              <TableHead>{t("agents.conversations")}</TableHead>
              <TableHead>{t("agents.resolved")}</TableHead>
              <TableHead>{t("agents.revenue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><span className="inline-flex items-center gap-2"><Bot className="text-muted-foreground size-4" aria-hidden /><EntityLink type="agent" id={r.id} label={r.name} /></span></TableCell>
                <TableCell className="num">{formatNumber(r.conv)}</TableCell>
                <TableCell className="num">{formatPercent(r.conv ? r.resolved / r.conv : 0, 0)}</TableCell>
                <TableCell className="num">{formatMoney(r.revenue, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function MarketingBody() {
  const t = useTranslations("reports");
  const { locale } = useAppLocale();
  const { data: coupons = [] } = useCouponList();
  const { data: carts = [] } = useAbandonedCarts();
  const recovered = carts.filter((c) => c.recoveryStatus === "recovered").length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("marketing.couponRevenue")} value={formatMoney(coupons.reduce((s, c) => s + c.stats.revenue.amount, 0), locale)} icon={Percent} />
        <StatCard label={t("marketing.uses")} value={formatNumber(coupons.reduce((s, c) => s + c.stats.uses, 0))} icon={Percent} />
        <StatCard label={t("marketing.carts")} value={formatNumber(carts.length)} icon={ShoppingCart} />
        <StatCard label={t("marketing.recovered")} value={formatPercent(carts.length ? recovered / carts.length : 0, 0)} icon={ShoppingCart} />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("marketing.coupons")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("marketing.coupon")}</TableHead>
                <TableHead>{t("marketing.status")}</TableHead>
                <TableHead>{t("marketing.uses")}</TableHead>
                <TableHead>{t("marketing.discount")}</TableHead>
                <TableHead>{t("marketing.revenue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><RowLink type="coupon" id={c.id} label={c.code} /></TableCell>
                  <TableCell><StatusBadge entity="coupon" value={c.status} /></TableCell>
                  <TableCell className="num">{formatNumber(c.stats.uses)}</TableCell>
                  <TableCell className="num">{formatMoney(c.stats.discountGiven.amount, locale)}</TableCell>
                  <TableCell className="num">{formatMoney(c.stats.revenue.amount, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function TaxBody({ days }: { days: number }) {
  const t = useTranslations("reports");
  const { locale } = useAppLocale();
  const { data: invoices = [] } = useInvoiceList();
  const cur = invoices.filter((i) => inRange(i.issuedAt, days));
  const prev = invoices.filter((i) => inRange(i.issuedAt, days, days));
  const vat = cur.reduce((s, i) => s + (i.type === "credit_note" ? -i.vatAmount.amount : i.vatAmount.amount), 0);
  const prevVat = prev.reduce((s, i) => s + i.vatAmount.amount, 0);
  const byStatus = new Map<string, number>();
  cur.forEach((i) => byStatus.set(i.zatcaStatus, (byStatus.get(i.zatcaStatus) ?? 0) + 1));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("tax.vatTotal")} value={formatMoney(vat, locale)} delta={delta(vat, prevVat)} icon={Percent} />
        <StatCard label={t("tax.invoices")} value={formatNumber(cur.length)} icon={FileText} />
        <StatCard label={t("tax.creditNotes")} value={formatNumber(cur.filter((i) => i.type === "credit_note").length)} icon={FileText} />
        <StatCard label={t("tax.rejected")} value={formatNumber(cur.filter((i) => i.zatcaStatus === "rejected").length)} icon={FileText} />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("tax.invoicesList")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tax.invoice")}</TableHead>
                <TableHead>{t("tax.vat")}</TableHead>
                <TableHead>{t("tax.total")}</TableHead>
                <TableHead>{t("tax.zatca")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cur.slice(0, 15).map((i) => (
                <TableRow key={i.id}>
                  <TableCell><RowLink type="invoice" id={i.id} label={i.number} /></TableCell>
                  <TableCell className="num">{formatMoney(i.vatAmount.amount, locale)}</TableCell>
                  <TableCell className="num">{formatMoney(i.total.amount, locale)}</TableCell>
                  <TableCell><StatusBadge entity="invoice" field="zatcaStatus" value={i.zatcaStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
