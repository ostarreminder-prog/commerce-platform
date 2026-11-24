"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { useMediaList } from "@repo/api-client";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { auditTheme, type QualityIssue } from "./quality-audit";
import type { EditorController } from "./use-editor-state";

const SCORE_CLASS: Record<string, string> = {
  fast: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  slow: "bg-destructive/10 text-destructive",
};
const BASE_TEMPLATES = new Set(["home", "product", "category", "cart", "page"]);

/** Third settings tab: design-quality audit — clickable issues + a rough speed score. */
export function EditorQualityPanel({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const { data: media = [] } = useMediaList();
  const report = React.useMemo(() => auditTheme(editor.draft, media), [editor.draft, media]);

  const templateLabel = (tpl: string) => {
    if (BASE_TEMPLATES.has(tpl)) return t(`editor.template.${tpl}`);
    const custom = editor.draft.customTemplates?.find((c) => c.id === tpl);
    return custom ? (locale === "ar" ? custom.nameAr || custom.nameEn : custom.nameEn || custom.nameAr) : tpl;
  };
  const open = (issue: QualityIssue) => {
    if (issue.sectionId) {
      editor.selectTemplate(issue.template);
      editor.selectSection(issue.sectionId);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Gauge className="size-4" aria-hidden />
          {t("editor.quality.score")}
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", SCORE_CLASS[report.score])}>
          {t(`editor.quality.${report.score}`)}
        </span>
      </div>
      {report.issues.length ? (
        <ul className="space-y-1.5">
          {report.issues.map((issue, i) => (
            <li key={`${issue.kind}-${issue.sectionId}-${issue.detail}-${i}`}>
              <button
                type="button"
                onClick={() => open(issue)}
                disabled={!issue.sectionId}
                className="hover:bg-accent flex w-full items-start gap-2 rounded-lg border p-2 text-start disabled:cursor-default"
              >
                <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{t(`editor.quality.issues.${issue.kind}`)}</span>
                  <span className="text-muted-foreground block truncate text-[11px]">
                    {[issue.detail, issue.template ? templateLabel(issue.template) : ""].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-xs">
          <CheckCircle2 className="text-success size-4" aria-hidden />
          {t("editor.quality.clean")}
        </p>
      )}
    </div>
  );
}
