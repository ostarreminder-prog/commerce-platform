"use client";

import * as React from "react";
import { Copy, KeyRound, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@repo/ui/components/page-header";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/cn";

const BASE = "https://api.tajer.sa/v1";
const ENDPOINTS = [
  { key: "listOrders", method: "GET", path: "/orders?status=processing", body: null, res: { data: [{ id: "ord_10271", number: 10271, status: "processing", total: 104800, currency: "SAR" }], next_cursor: "c_2" } },
  { key: "getOrder", method: "GET", path: "/orders/ord_10271", body: null, res: { id: "ord_10271", number: 10271, status: "processing", items: [{ product_id: "prd_001", qty: 2, price: 6500 }], total: 104800 } },
  { key: "updateOrder", method: "PATCH", path: "/orders/ord_10271", body: { status: "shipped", tracking_number: "SMSA123456" }, res: { id: "ord_10271", status: "shipped" } },
  { key: "listProducts", method: "GET", path: "/products?limit=20", body: null, res: { data: [{ id: "prd_001", sku: "NK-COF-1001", price: 6500, stock: 42 }], next_cursor: null } },
  { key: "createProduct", method: "POST", path: "/products", body: { name: { ar: "قهوة خولانية", en: "Khawlani coffee" }, price: 7500, stock: 30 }, res: { id: "prd_031", status: "draft" } },
  { key: "listCustomers", method: "GET", path: "/customers?segment=vip", body: null, res: { data: [{ id: "cus_001", name: "نورة العتيبي", orders: 3 }], next_cursor: null } },
] as const;
const METHOD_TONE = { GET: "bg-info/10 text-info", POST: "bg-success/10 text-success", PATCH: "bg-warning/10 text-warning" } as const;

function Code({ children, label }: { children: string; label: string }) {
  const t = useTranslations("common");
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-xs font-medium">{label}</p>
      <div className="relative" dir="ltr">
      <pre className="overflow-x-auto rounded-lg bg-ink p-4 pe-12 text-xs leading-relaxed text-paper">
        <code>{children}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute end-2 top-2 text-paper/70 hover:bg-paper/10 hover:text-paper"
        aria-label={t("copy")}
        onClick={() => void navigator.clipboard.writeText(children).then(() => toast.success(t("copied")))}
      >
        <Copy aria-hidden />
      </Button>
      </div>
    </div>
  );
}

export function DocsView() {
  const t = useTranslations("docs");
  const [active, setActive] = React.useState<(typeof ENDPOINTS)[number]["key"]>("listOrders");
  const ep = ENDPOINTS.find((e) => e.key === active) ?? ENDPOINTS[0];
  const curl = [`curl -X ${ep.method} "${BASE}${ep.path}" \\`, `  -H "Authorization: Bearer $ACCESS_TOKEN"`]
    .concat(ep.body ? [`  -H "Content-Type: application/json" \\`, `  -d '${JSON.stringify(ep.body)}'`] : [])
    .join("\n")
    .replace('TOKEN"\n  -H "Content', 'TOKEN" \\\n  -H "Content');

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex gap-3 p-5">
            <KeyRound className="text-primary size-5 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p className="font-semibold">{t("auth")}</p>
              <p className="text-muted-foreground text-sm">{t("authText")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex gap-3 p-5">
            <Timer className="text-primary size-5 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p className="font-semibold">{t("baseUrl")}</p>
              <code className="bg-muted block w-fit rounded px-2 py-0.5 font-mono text-sm" dir="ltr">
                {BASE}
              </code>
              <p className="text-muted-foreground text-sm">{t("rateLimit")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr] [&>*]:min-w-0">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("endpoints")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            {ENDPOINTS.map((e) => (
              <button
                key={e.key}
                type="button"
                aria-pressed={active === e.key}
                onClick={() => setActive(e.key)}
                className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors", active === e.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
              >
                <span className={cn("w-12 rounded px-1 py-0.5 text-center font-mono text-[10px] font-bold", METHOD_TONE[e.method])}>{e.method}</span>
                {t(`list.${e.key}`)}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>{t(`list.${ep.key}`)}</CardTitle>
            <div className="flex items-center gap-2" dir="ltr">
              <span className={cn("rounded px-2 py-0.5 font-mono text-xs font-bold", METHOD_TONE[ep.method])}>{ep.method}</span>
              <code className="truncate font-mono text-sm">{ep.path}</code>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Code label={t("example")}>{curl}</Code>
            <Code label={t("response")}>{JSON.stringify(ep.res, null, 2)}</Code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
