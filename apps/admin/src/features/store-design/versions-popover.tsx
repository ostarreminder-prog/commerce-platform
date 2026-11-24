"use client";

import * as React from "react";
import { Eye, History } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { formatDateTime } from "@repo/ui/lib/format";
import type { EditorController } from "./use-editor-state";

/** Versions popover — list with per-version "معاينة" (snapshot → preview) and "استعادة" (snapshot → draft). */
export function VersionsPopover({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const versions = React.useMemo(
    () => [...editor.draft.versions].sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    [editor.draft.versions],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <History aria-hidden />
          {t("editor.versions")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        {versions.length ? (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {versions.map((v) => (
              <li key={v.id} className="hover:bg-accent flex items-center gap-1 rounded-md p-2">
                <div className="min-w-0 flex-1">
                  <p className="num text-sm font-medium">{formatDateTime(v.at, locale)}</p>
                  <p className="text-muted-foreground truncate text-xs" dir="auto">
                    {v.note}
                  </p>
                </div>
                {v.snapshot ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => editor.startVersionPreview(v)} aria-label={t("editor.versionPreview.button")} title={t("editor.versionPreview.button")}>
                    <Eye aria-hidden />
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => editor.restoreVersion(v)}>
                  {t("editor.restore")}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground p-3 text-center text-sm">{t("editor.noVersions")}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
