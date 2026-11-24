"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSavePartnerApp } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { toast } from "@repo/ui/components/toaster";
import { RESOURCES } from "../apps/app-editor-constants";
import { AppLoader } from "./app-loader";

function ScopesForm({ app }: { app: PartnerApp }) {
  const t = useTranslations();
  const save = useSavePartnerApp();
  const [scopes, setScopes] = React.useState<string[]>(app.scopes);
  const toggle = (scope: string, on: boolean) =>
    setScopes((s) => (on ? [...new Set([...s, scope])] : s.filter((x) => x !== scope)));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <p className="text-muted-foreground text-sm">{t("editor.scopesText")}</p>
          <ul className="divide-y rounded-lg border">
            {RESOURCES.map((r) => (
              <li key={r} className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(`editor.resources.${r}`)}</span>
                  <span className="text-muted-foreground block text-xs">{t(`detail.scopeInfo.${r}`)}</span>
                </span>
                {(["read", "write"] as const).map((m) => {
                  const scope = `${r}:${m}`;
                  return (
                    <label key={m} className="flex cursor-pointer items-center gap-2">
                      <Checkbox checked={scopes.includes(scope)} onCheckedChange={(v) => toggle(scope, v === true)} />
                      {t(`editor.${m}`)}
                    </label>
                  );
                })}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          disabled={scopes.length === 0}
          loading={save.isPending}
          onClick={() =>
            save.mutate({ ...app, scopes, updatedAt: new Date().toISOString() }, { onSuccess: () => toast.success(t("common.saved")) })
          }
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

export function ScopesTab({ id }: { id: string }) {
  return <AppLoader id={id}>{(app) => <ScopesForm app={app} />}</AppLoader>;
}
