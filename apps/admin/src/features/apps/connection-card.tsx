"use client";

import * as React from "react";
import { Cable, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConfigureInstallation, useTestAppConnection } from "@repo/api-client";
import type { AppInstallation } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";

interface Row {
  key: string;
  value: string;
}

/** Post-install credentials + "test connection". The check is honestly
 * labelled simulated — it validates that stored fields are complete; no real
 * provider handshake exists without a backend. */
export function ConnectionCard({ installation: ins }: { installation: AppInstallation }) {
  const t = useTranslations("apps");
  const mt = useMsgToast();
  const configure = useConfigureInstallation();
  const test = useTestAppConnection();
  const [rows, setRows] = React.useState<Row[]>(() => {
    const entries = Object.entries(ins.settings ?? {});
    return entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];
  });

  const save = () => {
    const settings = Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]));
    configure.mutate([ins.id, settings], { onSuccess: () => mt.success("common.save.success"), onError: () => mt.error("common.save.error") });
  };

  const runTest = () =>
    test.mutate([ins.id], {
      onSuccess: (next) => (next.connectionStatus === "ok" ? mt.success("apps.testOk") : mt.error("apps.testFailed")),
      onError: () => mt.error("common.save.error"),
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          {t("connection.title")}
          {ins.connectionStatus ? (
            <Badge variant={ins.connectionStatus === "ok" ? "default" : ins.connectionStatus === "failed" ? "destructive" : "secondary"}>
              {t(`connection.${ins.connectionStatus}`)}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-xs">{t("connection.simulated")}</p>
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              dir="ltr"
              className="flex-1 text-start"
              placeholder={t("connection.keyPlaceholder")}
              value={row.key}
              aria-label={t("connection.keyPlaceholder")}
              onChange={(e) => setRows((r) => r.map((x, xi) => (xi === i ? { ...x, key: e.target.value } : x)))}
            />
            <Input
              dir="ltr"
              type="password"
              className="flex-1 text-start"
              placeholder={t("connection.valuePlaceholder")}
              value={row.value}
              aria-label={t("connection.valuePlaceholder")}
              onChange={(e) => setRows((r) => r.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}
            />
            <Button variant="ghost" size="icon-sm" aria-label={t("connection.removeField")} onClick={() => setRows((r) => r.filter((_, xi) => xi !== i))}>
              <Trash2 aria-hidden />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRows((r) => [...r, { key: "", value: "" }])}>
            <Plus aria-hidden />
            {t("connection.addField")}
          </Button>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={runTest} loading={test.isPending}>
              <Cable aria-hidden />
              {t("connection.test")}
            </Button>
            <Button size="sm" onClick={save} loading={configure.isPending}>
              {t("connection.save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
