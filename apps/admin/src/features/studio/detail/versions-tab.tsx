"use client";

import * as React from "react";
import { History, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgentVersions, useRestoreVersion } from "@repo/api-client";
import type { AgentVersion } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";
import { ConfirmDialog, Section, type TabProps } from "./shared";

export function VersionsTab({
  draft,
  readOnly,
  dirty,
}: Pick<TabProps, "draft" | "readOnly"> & { dirty: boolean }) {
  const mt = useMsgToast();
  const t = useTranslations("studio.detail.versions");
  const { locale } = useAppLocale();
  const versions = useAgentVersions(draft.id);
  const restore = useRestoreVersion();
  const [target, setTarget] = React.useState<AgentVersion | null>(null);
  return (
    <Section title={t("title")} description={t("hint")}>
      <DataState
        state={versions}
        isEmpty={(d) => d.length === 0}
        loading={
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        }
        empty={<EmptyState icon={History} title={t("emptyTitle")} description={t("emptyBody")} />}
      >
        {(list) => (
          <ol className="relative space-y-4 border-s ps-6">
            {list.map((v) => {
              const current = v.version === draft.version;
              return (
                <li key={v.id} className="relative">
                  <span
                    className={`ring-background absolute -start-[31px] top-4 size-3 rounded-full ring-4 ${current ? "bg-primary" : "bg-muted-foreground/40"}`}
                    aria-hidden
                  />
                  <div
                    className={`rounded-xl border p-4 ${current ? "border-primary/40 bg-primary/5" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="num font-bold">v{v.version}</span>
                      {current ? <Badge>{t("current")}</Badge> : null}
                      <span className="text-muted-foreground text-xs">
                        {formatDateTime(v.publishedAt, locale)} · {v.author}
                      </span>
                      {!current && !readOnly ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ms-auto"
                          onClick={() => setTarget(v)}
                        >
                          <RotateCcw aria-hidden /> {t("restore")}
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm">{v.note}</p>
                    {v.changes.length ? (
                      <ul className="mt-3 space-y-2">
                        {v.changes.map((c, i) => (
                          <li key={i} className="bg-muted/40 rounded-lg p-2.5 text-xs">
                            <span className="text-muted-foreground font-medium">
                              {t(`fields.${c.field}` as "fields.tone")}
                            </span>
                            <div className="mt-1 grid gap-1 sm:grid-cols-2">
                              <span
                                dir="auto"
                                className="bg-destructive/10 text-destructive line-clamp-2 rounded px-2 py-1 line-through"
                              >
                                {c.before}
                              </span>
                              <span
                                dir="auto"
                                className="bg-success/10 text-success line-clamp-2 rounded px-2 py-1"
                              >
                                {c.after}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </DataState>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => !o && setTarget(null)}
        title={t("restoreTitle", { v: target?.version ?? 0 })}
        description={dirty ? t("restoreBodyDirty") : t("restoreBody")}
        confirmLabel={t("restoreConfirm")}
        onConfirm={() =>
          target &&
          restore.mutate([draft.id, target.version], {
            onSuccess: () => mt.success("agents.rollback.success", { version: target.version }),
          })
        }
      />
    </Section>
  );
}
