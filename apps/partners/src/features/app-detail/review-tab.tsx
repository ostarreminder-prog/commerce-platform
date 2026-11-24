"use client";

import { Check, Send, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSavePartnerApp } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/cn";
import { AppLoader } from "./app-loader";

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        <Check className="size-3.5" />
      </span>
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function ReviewPanel({ app }: { app: PartnerApp }) {
  const t = useTranslations();
  const save = useSavePartnerApp();
  const checks = [
    { key: "checkName", ok: app.name.ar.trim() !== "" && (app.name.en ?? "").trim() !== "" },
    { key: "checkScopes", ok: app.scopes.length > 0 },
    { key: "checkRedirect", ok: app.redirectUrl.startsWith("https://") },
    { key: "checkWebhook", ok: app.webhookUrl === "" || app.webhookUrl.startsWith("https://") },
    { key: "checkListing", ok: Boolean(app.description?.ar.trim()) && Boolean(app.supportEmail?.trim()) },
  ] as const;
  const ready = checks.every((c) => c.ok);

  return (
    <div className="space-y-6">
      {app.status === "inReview" ? (
        <Alert variant="warning">
          <ShieldAlert aria-hidden />
          <AlertDescription>{t("editor.inReviewNote")}</AlertDescription>
        </Alert>
      ) : null}
      {app.status === "live" ? (
        <Alert variant="success">
          <Check aria-hidden />
          <AlertDescription>{t("detail.liveNote")}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.checklist")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2.5">
            {checks.map((c) => (
              <CheckRow key={c.key} ok={c.ok} label={t(`detail.${c.key}`)} />
            ))}
          </ul>
          {app.status === "draft" ? (
            <>
              {!ready ? <p className="text-muted-foreground text-xs">{t("detail.notReady")}</p> : null}
              <Button
                disabled={!ready}
                loading={save.isPending}
                onClick={() =>
                  save.mutate(
                    { ...app, status: "inReview", updatedAt: new Date().toISOString() },
                    { onSuccess: () => toast.success(t("editor.submitted")) },
                  )
                }
              >
                <Send aria-hidden />
                {t("editor.submit")}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function ReviewTab({ id }: { id: string }) {
  return <AppLoader id={id}>{(app) => <ReviewPanel app={app} />}</AppLoader>;
}
