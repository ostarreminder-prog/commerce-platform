"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import type { ThemeSection } from "@repo/contracts";
import { SECTION_DEFINITIONS, isSectionType } from "@repo/storefront-sections/editor";
import { useSectionData } from "@repo/storefront-sections";
import { Button } from "@repo/ui/components/button";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { suggestExperiences } from "./experience-suggestions";
import type { EditorController } from "./use-editor-state";

/**
 * Rule-based `view` suggestions under the section settings form — shows on
 * sections that expose an experience select (e.g. featured-products) and lets
 * the merchant apply the recommended experience in one click.
 */
export function EditorSuggestCard({ editor, section }: { editor: EditorController; section: ThemeSection }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const mt = useMsgToast();
  const { products, categories, collections } = useSectionData();
  const hasViewField =
    isSectionType(section.type) &&
    SECTION_DEFINITIONS[section.type].fields.some((field) => field.optionsSource === "experiences");
  const suggestions = React.useMemo(
    () => (hasViewField ? suggestExperiences({ products, categories, collections }, editor.selectedTemplate, section) : []),
    [hasViewField, products, categories, collections, editor.selectedTemplate, section],
  );
  if (!suggestions.length) return null;

  return (
    <div className="mt-5 space-y-2 rounded-xl border border-dashed p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Sparkles className="size-3.5" aria-hidden />
        {t("editor.suggest.title")}
      </p>
      {suggestions.map((suggestion) => (
        <div key={suggestion.experienceId} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t(`experience.${suggestion.experienceId}`)}</p>
            <p className="text-muted-foreground text-[11px] leading-snug">
              {t(`experience.reason.${suggestion.reasonKey}`, suggestion.params)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              editor.updateSection({ ...section, settings: { ...section.settings, view: suggestion.experienceId } });
              mt.success("editor.suggest.applied", { experience: t(`experience.${suggestion.experienceId}`) });
            }}
          >
            {t("editor.suggest.apply")}
          </Button>
        </div>
      ))}
    </div>
  );
}
