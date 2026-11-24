"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Mail, PackageX, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppSubmission, useReviewApp } from "@repo/api-client";
import type { AppSubmission } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import { ReviewStatusBadge, SubmissionLogo } from "./review-badges";

const REASONS = ["scope_abuse", "policy", "quality", "other"] as const;

function RejectDialog({ app, onClose }: { app: AppSubmission | null; onClose: () => void }) {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const review = useReviewApp();
  const [reason, setReason] = React.useState<(typeof REASONS)[number]>("scope_abuse");
  return (
    <Dialog open={Boolean(app)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("review.rejectTitle", { name: app?.name[locale] ?? "" })}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t("review.rejectText")}</p>
        <div className="space-y-1.5">
          <Label htmlFor="reject-reason">{t("review.reject")}</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as (typeof REASONS)[number])}>
            <SelectTrigger id="reject-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`review.reasons.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            loading={review.isPending}
            onClick={() => {
              if (!app) return;
              review.mutate(
                { id: app.id, status: "rejected", reason },
                { onSuccess: () => { toast.success(t("review.rejected", { name: app.name[locale] ?? app.name.ar })); onClose(); } },
              );
            }}
          >
            {t("review.confirmReject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppReviewDetail({ id }: { id: string }) {
  const t = useTranslations();
  const { locale, dir } = useAppLocale();
  const query = useAppSubmission(id);
  const review = useReviewApp();
  const [rejecting, setRejecting] = React.useState(false);
  const app = query.data;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (query.isPending) return <Skeleton className="h-96" />;
  if (query.isError || !app) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("review.notFound")}
        action={
          <Button variant="outline" asChild>
            <Link href="/apps-review">{t("review.back")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/apps-review">
          <Back aria-hidden />
          {t("review.back")}
        </Link>
      </Button>
      <div className="flex flex-wrap items-center gap-4">
        <SubmissionLogo name={app.name[locale] ?? app.name.ar} hue={app.hue} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{app.name[locale] ?? app.name.ar}</h1>
          <p className="text-muted-foreground text-sm">{app.tagline[locale] ?? app.tagline.ar}</p>
        </div>
        <ReviewStatusBadge status={app.status} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("review.app")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{app.description[locale] ?? app.description.ar}</p>
            <dl className="grid grid-cols-2 gap-3">
              {[
                [t("review.developer"), app.developer],
                [t("review.price"), app.monthlyPrice === 0 ? t("review.free") : `${formatMoney(app.monthlyPrice, locale)} ${t("common.perMonth")}`],
                [t("review.categoryLabel"), t(`category.${app.category}`)],
                [t("review.submitted"), formatRelativeTime(app.submittedAt, locale)],
              ].map(([k, v]) => (
                <div key={k} className="bg-muted/40 rounded-lg p-3">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="flex items-center gap-2">
              <Mail className="text-muted-foreground size-4" aria-hidden />
              <span dir="ltr">{app.developerEmail}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("review.scopes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {app.scopes.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs" dir="ltr">
                    {s}
                  </code>
                </li>
              ))}
            </ul>
            {app.status === "rejected" && app.rejectionReason ? (
              <Badge variant="destructive" className="mt-4">
                {t(`review.reasons.${(app.rejectionReason as (typeof REASONS)[number]) ?? "other"}`)}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      </div>
      {app.status === "pending" ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRejecting(true)}>
            <X aria-hidden />
            {t("review.reject")}
          </Button>
          <Button
            loading={review.isPending}
            onClick={() =>
              review.mutate({ id: app.id, status: "approved" }, { onSuccess: () => toast.success(t("review.approved", { name: app.name[locale] ?? app.name.ar })) })
            }
          >
            <Check aria-hidden />
            {t("review.approve")}
          </Button>
        </div>
      ) : null}
      <RejectDialog app={rejecting ? app : null} onClose={() => setRejecting(false)} />
    </div>
  );
}
