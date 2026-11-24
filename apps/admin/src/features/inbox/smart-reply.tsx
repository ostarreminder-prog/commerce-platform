"use client";

import * as React from "react";
import { RefreshCw, Send, Sparkles, ThumbsDown, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSuggestReply } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { EntityLink } from "@/components/entity/entity-link";

/**
 * Smart-reply draft (§5.14): generates a draft from the conversation's last
 * customer message + linked knowledge — the staff member reviews, edits,
 * regenerates or discards. Nothing is sent without an explicit send click.
 */
export function SmartReply({ conversationId, onSend, disabled }: { conversationId: string; onSend: (text: string) => void; disabled?: boolean }) {
  const t = useTranslations("inbox.smartReply");
  const mt = useMsgToast();
  const suggest = useSuggestReply();
  const [draft, setDraft] = React.useState("");
  const [alt, setAlt] = React.useState(false);

  const generate = () =>
    suggest.mutate(conversationId, {
      onError: () => mt.error("inbox.message.failed"),
    });

  /* Mock rephrase — flips the draft between the two deterministic phrasings. */
  const rephrase = () => {
    const base = draft.trim();
    if (!base) return;
    setAlt((v) => !v);
    setDraft(alt ? base : base.replace(/^هلا/, "أهلاً وسهلاً").replace(/!/, "،"));
  };

  const sources = suggest.data?.sources ?? [];

  return (
    <div className="space-y-2">
      {!suggest.data ? (
        <Button variant="outline" size="sm" className="gap-1.5" disabled={disabled || suggest.isPending} onClick={generate}>
          <Sparkles className="size-3.5" aria-hidden />
          {suggest.isPending ? t("generating") : t("suggest")}
        </Button>
      ) : (
        <div className="border-primary/30 bg-primary/5 space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-primary flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="size-3.5" aria-hidden />
              {t("draftTitle")}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" aria-label={t("regenerate")} disabled={suggest.isPending} onClick={generate}>
                <RefreshCw className="size-3.5" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" aria-label={t("rephrase")} onClick={rephrase}>
                <Wand2 className="size-3.5" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive size-7"
                aria-label={t("reject")}
                onClick={() => {
                  suggest.reset();
                  setDraft("");
                }}
              >
                <ThumbsDown className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>
          <Textarea
            value={draft || suggest.data.draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="bg-background resize-none text-sm"
            aria-label={t("draftTitle")}
          />
          {sources.length ? (
            <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px]">
              {t("sources")}
              {sources.map((s) => (
                <Badge key={`${s.type}-${s.id}`} variant="secondary" className="font-normal">
                  <EntityLink type={s.type === "product" ? "product" : "knowledge"} id={s.id} label={s.label} />
                </Badge>
              ))}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" disabled={!(draft || suggest.data.draft).trim()} onClick={() => onSend((draft || suggest.data?.draft || "").trim())}>
              <Send className="size-3.5 rtl:-scale-x-100" aria-hidden />
              {t("acceptSend")}
            </Button>
            <span className="text-muted-foreground text-[11px]">{t("hint")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
