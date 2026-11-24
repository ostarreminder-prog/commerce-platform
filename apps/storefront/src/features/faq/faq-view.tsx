"use client";

import Link from "next/link";
import { ChevronDown, MessageCircle, MessagesSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useKnowledgeList } from "@repo/api-client";
import { Card, CardContent } from "@repo/ui/components/card";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * Public FAQ — renders the FAQ/policy knowledge sources the merchant already
 * curates for the support agents (admin /knowledge). Ready sources only.
 */
export function FaqView() {
  const t = useTranslations("store");
  const { data: sources = [], isPending } = useKnowledgeList();
  const groups = sources.filter((s) => s.status === "ready" && (s.type === "faq" || s.type === "policy") && s.faq.length > 0);

  if (isPending)
    return (
      <div className="container max-w-3xl space-y-4 py-10">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="container max-w-3xl space-y-8 py-8">
      <Breadcrumbs items={[{ label: t("faq.title") }]} />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("faq.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("faq.subtitle")}</p>
      </div>
      {groups.length ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id} className="space-y-3" aria-labelledby={`faq-${g.id}`}>
              <h2 id={`faq-${g.id}`} className="flex items-center gap-2 font-semibold">
                <MessagesSquare className="text-primary size-5" aria-hidden />
                {g.title}
              </h2>
              <div className="divide-y rounded-xl border">
                {g.faq.map((f, i) => (
                  <details key={i} className="group px-4 py-3 open:bg-muted/30">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="text-muted-foreground pt-2 text-sm leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <MsgEmptyState emptyKey="search" params={{ query: t("faq.title") }} />
      )}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm font-medium">{t("faq.stillNeedHelp")}</p>
          <Link href="/contact" className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
            <MessageCircle className="size-4" aria-hidden />
            {t("contact.title")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
