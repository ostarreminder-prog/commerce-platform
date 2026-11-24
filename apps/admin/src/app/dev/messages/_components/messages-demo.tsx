"use client";

import * as React from "react";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Banner } from "@repo/ui/components/banner";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { PageError } from "@repo/ui/components/page-error";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useMsg, useZodMessage } from "@repo/ui/hooks/use-msg";
import { useTranslations } from "next-intl";
import { msgErrorMap } from "@repo/ui/lib/zod-error-map";
import { apiErrorKey } from "@repo/ui/lib/api-error-map";

export function ToastsDemo() {
  const mt = useMsgToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => mt.success("products.saved", { name: "عطر العود" })}>
        success
      </Button>
      <Button variant="outline" onClick={() => mt.success("products.archive.success", { name: "عطر العود" }, { undo: () => mt.info("common.undo") })}>
        success + undo
      </Button>
      <Button variant="outline" onClick={() => mt.error("orders.refund.failed", { reason: "رفض البنك" }, { retry: () => mt.info("common.retry") })}>
        error + retry
      </Button>
      <Button variant="outline" onClick={() => mt.info("orders.new.toast", { number: 1042, amount: "350.00 ر.س" })}>
        info
      </Button>
    </div>
  );
}

export function ConfirmDialogsDemo() {
  const td = useTranslations("dev");
  const [kind, setKind] = React.useState<"normal" | "danger" | "text" | "otp" | null>(null);
  const mt = useMsgToast();
  const done = () => {
    setKind(null);
    mt.success("common.save.success");
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setKind("normal")}>{td("normal")}</Button>
      <Button variant="outline" onClick={() => setKind("danger")}>{td("danger")}</Button>
      <Button variant="outline" onClick={() => setKind("text")}>{td("requireText")}</Button>
      <Button variant="outline" onClick={() => setKind("otp")}>OTP</Button>

      <ConfirmDialog
        open={kind === "normal"}
        onOpenChange={() => setKind(null)}
        titleKey="themes.apply.title"
        bodyKey="themes.apply.body"
        params={{ theme: "وردة" }}
        onConfirm={done}
      />
      <ConfirmDialog
        open={kind === "danger"}
        onOpenChange={() => setKind(null)}
        titleKey="orders.cancel.title"
        bodyKey="orders.cancel.body"
        confirmKey="orders.cancel.cta"
        danger
        onConfirm={done}
      />
      <ConfirmDialog
        open={kind === "text"}
        onOpenChange={() => setKind(null)}
        titleKey="danger.delete.title"
        bodyKey="danger.delete.body"
        confirmKey="products.delete.cta"
        danger
        requireText={td("storeName")}
        onConfirm={done}
      />
      <ConfirmDialog
        open={kind === "otp"}
        onOpenChange={() => setKind(null)}
        titleKey="staff.transferOwnership.title"
        bodyKey="staff.transferOwnership.body"
        danger
        requireOtp
        onConfirm={done}
      />
    </div>
  );
}

export function BannersDemo() {
  const [hidden, setHidden] = React.useState<Record<string, boolean>>({});
  const items: Array<{ variant: "info" | "success" | "warning" | "error" | "danger"; key: string; params?: Record<string, string | number> }> = [
    { variant: "info", key: "verification.banner.inReview" },
    { variant: "success", key: "verification.approved" },
    { variant: "warning", key: "shipments.delayed.banner", params: { count: 5 } },
    { variant: "error", key: "billing.pastDue.banner", params: { date: "15 ديسمبر" } },
    { variant: "danger", key: "admin.support.banner", params: { store: "نخلة", reason: "مشكلة في الدفع", time: "58:12" } },
  ];
  return (
    <div className="space-y-3">
      {items.map((b) =>
        hidden[b.key] ? null : (
          <Banner key={b.key} variant={b.variant} textKey={b.key} params={b.params} onDismiss={() => setHidden((h) => ({ ...h, [b.key]: true }))} />
        ),
      )}
    </div>
  );
}

export function EmptyStatesDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MsgEmptyState emptyKey="orders" />
      <MsgEmptyState emptyKey="orders.filtered" />
      <MsgEmptyState emptyKey="products" onAction={() => {}} />
      <MsgEmptyState emptyKey="inbox" onAction={() => {}} />
      <MsgEmptyState emptyKey="approvals" />
      <MsgEmptyState emptyKey="knowledge" onAction={() => {}} />
    </div>
  );
}

export function PageErrorsDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PageError errorKey="load" onRetry={() => {}} />
      <PageError errorKey="403" />
      <PageError errorKey="404" />
      <PageError errorKey="500" onRetry={() => {}} />
    </div>
  );
}

const demoSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  price: z.number().positive(),
  slug: z.string().regex(/^[a-z0-9-]+$/).refine(() => false, { params: { msgKey: "validation.slug.taken", msgParams: { suggestions: "nakhla-2, nakhla-store" } } }),
});

export function ValidationDemo() {
  const td = useTranslations("dev");
  const t = useMsg();
  const zodMsg = useZodMessage();
  const [issues, setIssues] = React.useState<z.ZodIssue[]>([]);

  const run = () => {
    const res = demoSchema.safeParse({ name: "ع", email: "bad", price: -1, slug: "x" }, { errorMap: msgErrorMap });
    setIssues(res.success ? [] : res.error.issues);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={run}>{td("runZod")}</Button>
      </div>
      {issues.length ? (
        <div className="space-y-2">
          <p className="text-destructive text-sm font-medium">{t("validation.form.summary", { count: issues.length })}</p>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="text-destructive text-sm">
                <code className="text-muted-foreground">{issue.path.join(".")}</code>: {zodMsg(issue.message)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Card>
        <CardHeader><CardTitle className="text-sm">api-error-map</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          {["NETWORK", "TIMEOUT", "RATE_LIMITED", "UNAUTHORIZED", "FORBIDDEN", "CONFLICT", "UNKNOWN_CODE"].map((code) => (
            <p key={code}><code>{code}</code> → <code>{apiErrorKey(code)}</code></p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function FieldErrorDemo() {
  const td = useTranslations("dev");
  const t = useMsg();
  return (
    <div className="max-w-sm space-y-1.5">
      <Label htmlFor="demo-phone">{td("phone")}</Label>
      <Input id="demo-phone" defaultValue="123" aria-invalid className="border-destructive" dir="ltr" />
      <p className="text-destructive text-xs">{t("validation.phone.format")}</p>
    </div>
  );
}
