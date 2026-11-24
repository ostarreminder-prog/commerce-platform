"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import { PageError } from "@repo/ui/components/page-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { SalesBody, ProductsBody, CustomersBody } from "./report-bodies";
import { AgentsBody, MarketingBody, TaxBody } from "./report-ops";
import { isReportType } from "./report-data";

const RANGES = ["7", "30", "90"] as const;

export function ReportDetail({ type }: { type: string }) {
  const t = useTranslations("reports");
  const mt = useMsgToast();
  const [range, setRange] = React.useState<string>("30");
  const [compare, setCompare] = React.useState(true);
  if (!isReportType(type)) return <PageError errorKey="404" />;
  const days = Number(range);
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: "/reports" }, { label: t(`types.${type}`) }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t(`types.${type}`)}</h1>
          <p className="text-muted-foreground text-sm">{t(`typeDesc.${type}`)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Label className="flex items-center gap-2 text-sm font-normal">
            <Switch checked={compare} onCheckedChange={setCompare} />
            {t("comparePrevious")}
          </Label>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40" aria-label={t("range.30")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`range.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => mt.info("common.export.started")}>
            <Download aria-hidden />
            {t("export")}
          </Button>
        </div>
      </div>
      {type === "sales" ? <SalesBody days={days} compare={compare} /> : null}
      {type === "products" ? <ProductsBody /> : null}
      {type === "customers" ? <CustomersBody days={days} /> : null}
      {type === "agents" ? <AgentsBody /> : null}
      {type === "marketing" ? <MarketingBody /> : null}
      {type === "tax" ? <TaxBody days={days} /> : null}
    </div>
  );
}
