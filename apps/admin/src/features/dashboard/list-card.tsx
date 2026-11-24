"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";

export function ListCard({ title, href, count, loading, empty, children }: { title: string; href: string; count?: number; loading: boolean; empty: string; children: React.ReactNode[] }) {
  const t = useTranslations("sales.home");
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          {count ? <span className="bg-warning/15 text-warning num rounded-full px-2 py-0.5 text-xs font-medium">{formatNumber(count)}</span> : null}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>{t("viewAll")}<ChevronLeft className="ltr:rotate-180" aria-hidden /></Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>
        ) : children.length ? (
          <ul className="divide-y">{children}</ul>
        ) : (
          <p className="text-muted-foreground flex h-full min-h-24 items-center justify-center text-sm">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
