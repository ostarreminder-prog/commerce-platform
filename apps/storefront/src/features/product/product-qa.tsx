"use client";

import * as React from "react";
import { HelpCircle, MessagesSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAskProductQuestion, useProductQuestions } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate } from "@repo/ui/lib/format";
import { useSession } from "@/components/session-context";

/**
 * Product Q&A — real records via the qa mock API. Asked questions land as
 * `pending` (visible immediately, honestly unanswered until staff replies).
 */
export function ProductQA({ productId }: { productId: string }) {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { customer } = useSession();
  const { data: questions = [] } = useProductQuestions(productId);
  const ask = useAskProductQuestion();
  const [question, setQuestion] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    ask.mutate([productId, { name: customer?.name ?? "", question }], {
      onSuccess: () => {
        setQuestion("");
        setOpen(false);
        mt.success("store.qa.submitted");
      },
      onError: () => mt.error("common.server.error"),
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <MessagesSquare className="text-primary size-5" aria-hidden />
          {t("qa.title")}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <HelpCircle className="size-4" aria-hidden />
          {t("qa.ask")}
        </Button>
      </div>
      {open ? (
        <form onSubmit={submit} className="bg-muted/30 space-y-3 rounded-xl border p-4">
          <Textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("qa.placeholder")} aria-label={t("qa.placeholder")} required />
          <Button type="submit" loading={ask.isPending} disabled={!question.trim()}>
            {t("qa.submit")}
          </Button>
        </form>
      ) : null}
      {questions.length ? (
        <ul className="divide-y rounded-xl border">
          {questions.map((q) => (
            <li key={q.id} className="space-y-2 p-4">
              <p className="text-sm font-medium">
                <span className="text-muted-foreground font-normal">{q.authorName} · </span>
                {q.question}
              </p>
              {q.answer ? (
                <p className="bg-muted/40 rounded-lg px-3 py-2 text-sm">
                  <span className="text-primary block text-xs font-semibold">{t("qa.storeAnswer", { name: q.answeredBy?.name ?? "" })}</span>
                  {q.answer}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {t("qa.pending")} · {formatDate(q.createdAt, locale)}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("qa.empty")}</p>
      )}
    </section>
  );
}
