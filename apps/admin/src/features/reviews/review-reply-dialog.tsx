"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReplyToReview } from "@repo/api-client";
import type { Review } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/cn";

/** Merchant reply dialog — the saved text renders under the review on the PDP. */
export function ReviewReplyDialog({ review, productName, onClose }: { review: Review; productName: string; onClose: () => void }) {
  const t = useTranslations("catalog.reviews");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const reply = useReplyToReview();
  const [text, setText] = React.useState(review.merchantReply?.text ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      mt.error("reviews.replyRequired");
      return;
    }
    reply.mutate([review.id, text.trim()], {
      onSuccess: () => {
        mt.success("reviews.replySaved");
        onClose();
      },
      onError: () => mt.error("reviews.submitFailed"),
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("reply.title")}</DialogTitle>
          <DialogDescription>{t("reply.description")}</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/50 space-y-2 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground truncate font-medium">{productName}</span>
            <span className="flex" aria-label={`${review.rating}/5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("size-3", i < review.rating ? "fill-warning text-warning" : "text-muted")} aria-hidden />
              ))}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{review.text}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="review-reply">{t("reply.label")}</Label>
            <Textarea id="review-reply" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("reply.placeholder")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={reply.isPending || !text.trim()}>
              {t("reply.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
