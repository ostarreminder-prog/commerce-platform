"use client";

import * as React from "react";
import {
  FileText,
  Globe,
  ListChecks,
  Package,
  Plus,
  ScrollText,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddKnowledge, useKnowledgeSources } from "@repo/api-client";
import type { KnowledgeSource } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DataState } from "@repo/ui/components/data-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { InheritBlock, Section, type TabProps } from "./shared";
import { AddSourceDialog } from "./add-source-dialog";

const typeIcons: Record<KnowledgeSource["type"], LucideIcon> = {
  file: FileText,
  text: Type,
  faq: ListChecks,
  url: Globe,
  policy: ScrollText,
  product_catalog: Package,
};


export function KnowledgeTab(props: TabProps) {
  const mt = useMsgToast();
  const { draft, patch, readOnly } = props;
  const t = useTranslations("studio.detail.knowledge");
  const { locale } = useAppLocale();
  const sources = useKnowledgeSources();
  const add = useAddKnowledge();
  const [open, setOpen] = React.useState(false);
  const inheriting = Boolean(draft.parentId && draft.inheritFromParent.knowledge);
  return (
    <Section
      title={t("title")}
      description={t("hint")}
      action={
        !readOnly && !inheriting ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus aria-hidden /> {t("add")}
          </Button>
        ) : null
      }
    >
      <InheritBlock {...props} section="knowledge" tab="knowledge">
        {(source) => (
          <DataState state={sources} loading={<Skeleton className="h-48 w-full rounded-xl" />}>
            {(all) => (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  {t("selected", { count: source.knowledgeSourceIds.length, total: all.length })}
                </p>
                <ul className="grid gap-2 md:grid-cols-2">
                  {all.map((k) => {
                    const Icon = typeIcons[k.type];
                    const checked = source.knowledgeSourceIds.includes(k.id);
                    return (
                      <li key={k.id}>
                        <label
                          htmlFor={`kn-${k.id}`}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:disabled]:cursor-not-allowed",
                            checked && "border-primary bg-primary/5",
                          )}
                        >
                          <Checkbox
                            id={`kn-${k.id}`}
                            checked={checked}
                            onCheckedChange={(v) =>
                              patch((a) => ({
                                ...a,
                                knowledgeSourceIds: v
                                  ? [...a.knowledgeSourceIds, k.id]
                                  : a.knowledgeSourceIds.filter((x) => x !== k.id),
                              }))
                            }
                          />
                          <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span dir="auto" className="block truncate text-sm font-medium">
                              {k.title}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {k.type === "faq" ? (
                                t("pairsCount", { count: k.faq.length })
                              ) : k.url ? (
                                <bdi>{k.url}</bdi>
                              ) : k.file ? (
                                <bdi>{formatNumber(Math.round(k.file.sizeBytes / 1024))} KB</bdi>
                              ) : null}
                              ·{k.lastSyncedAt ? formatRelativeTime(k.lastSyncedAt, locale) : null}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </DataState>
        )}
      </InheritBlock>
      <AddSourceDialog
        open={open}
        onOpenChange={setOpen}
        pending={add.isPending}
        onAdd={(s) =>
          add.mutate([draft.id, s], {
            onSuccess: (created) => {
              patch((a) => ({ ...a, knowledgeSourceIds: [...a.knowledgeSourceIds, created.id] }));
              mt.success("knowledge.uploaded", { title: created.title });
              setOpen(false);
            },
          })
        }
      />
    </Section>
  );
}
