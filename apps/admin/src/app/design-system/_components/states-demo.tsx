"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { sampleOrders, type SampleOrder } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { DataState, type AsyncState } from "@repo/ui/components/data-state";
import { TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Money } from "@repo/ui/components/money";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toaster";

const STATES = ["loading", "empty", "error", "data"] as const;
type DemoState = (typeof STATES)[number];

export function StatesDemo() {
  const t = useTranslations("designSystem.states");
  const [mode, setMode] = React.useState<DemoState>("data");

  const state: AsyncState<SampleOrder[]> = React.useMemo(() => {
    const refetch = () => {
      toast(t("errorRetried"));
      setMode("data");
    };
    switch (mode) {
      case "loading":
        return { status: "pending", data: undefined };
      case "error":
        return { status: "error", data: undefined, error: new Error("demo"), refetch };
      case "empty":
        return { status: "success", data: [] };
      case "data":
        return { status: "success", data: sampleOrders.slice(0, 4) };
    }
  }, [mode, t]);

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(value) => setMode(value as DemoState)}>
        <TabsList aria-label={t("switcher")}>
          {STATES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(value)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div aria-live="polite">
        <DataState
          state={state}
          loading={<TableSkeleton rows={4} columns={3} />}
          isEmpty={(orders) => orders.length === 0}
          empty={
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={
                <Button>
                  <Share2 aria-hidden />
                  {t("emptyAction")}
                </Button>
              }
            />
          }
        >
          {(orders) => (
            <ul className="bg-card divide-y rounded-lg border">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span className="num font-medium">{order.number}</span>
                  <span className="text-muted-foreground flex-1 truncate">{order.customer}</span>
                  <Money amount={order.total} />
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </div>
    </div>
  );
}
