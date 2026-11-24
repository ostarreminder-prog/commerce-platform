"use client";

import * as React from "react";
import { Check, FileUp, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSubmitVerification, useUploadVerificationDoc, useVerification } from "@repo/api-client";
import type { StoreVerification } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";

const STEPS = ["details", "documents", "review", "live"] as const;
const STATUS_INDEX: Record<StoreVerification["status"], number> = { not_started: 0, in_review: 2, approved: 3, rejected: 2 };

/** KYC / payment verification status — document upload stubs + submit (spec §5.24, §4.20). */
export function VerificationView() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { data, isPending } = useVerification();
  const upload = useUploadVerificationDoc();
  const submit = useSubmitVerification();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const done = STATUS_INDEX[data.status];
  const missing = data.documents.filter((d) => d.status === "missing").length;
  const stubUpload = (docId: string) => upload.mutate([docId, `${docId}-scan.pdf`], { onSuccess: () => mt.success("common.save.success") });
  return (
    <div className="space-y-4">
      {data.status === "in_review" ? <Banner variant="info" textKey="verification.banner.inReview" /> : null}
      {data.status === "approved" ? <Banner variant="success" textKey="verification.approved" /> : null}
      {data.status === "rejected" ? <Banner variant="error" textKey="verification.banner.rejected" params={{ reason: data.rejectionReason ?? "—" }} /> : null}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("verification.title")}</CardTitle>
            <CardDescription>{t("verification.hint")}</CardDescription>
          </div>
          <Badge variant={data.status === "approved" ? "success" : data.status === "rejected" ? "destructive" : "warning"}>{t(`verification.status.${data.status}`)}</Badge>
        </CardHeader>
        <CardContent>
          <ol className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    i < done ? "bg-success/15 text-success" : i === done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn("text-xs", i <= done ? "font-medium" : "text-muted-foreground")}>{t(`verification.steps.${s}`)}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("verification.docs.title")}</CardTitle>
          <CardDescription>{t("verification.docs.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <FileUp className="text-muted-foreground size-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t(`verification.docs.kinds.${d.kind}`)}</span>
                <span dir="ltr" className="text-muted-foreground block truncate text-xs">
                  {d.fileName ?? t("verification.docs.missing")}
                </span>
              </span>
              <Badge variant={d.status === "uploaded" ? "success" : d.status === "rejected" ? "destructive" : "secondary"}>{t(`verification.docs.status.${d.status}`)}</Badge>
              <Button variant="outline" size="sm" loading={upload.isPending} onClick={() => stubUpload(d.id)}>
                <Upload aria-hidden /> {t(d.fileName ? "verification.docs.replace" : "verification.docs.upload")}
              </Button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button disabled={missing > 0 || data.status === "in_review" || data.status === "approved"} onClick={() => setConfirmOpen(true)}>
              {t("verification.submit")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        titleKey="verification.submit.confirm.title"
        bodyKey="verification.submit.confirm.body"
        pending={submit.isPending}
        onConfirm={() =>
          submit.mutate([], {
            onSuccess: () => {
              mt.success("verification.submitted");
              setConfirmOpen(false);
            },
          })
        }
      />
    </div>
  );
}
