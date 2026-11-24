"use client";

import { useTranslations } from "next-intl";
import { PAGE_EXPERIENCE_OPTIONS, isPageExperience } from "@repo/storefront-sections/editor";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useMsg } from "@repo/ui/hooks/use-msg";
import type { EditorController } from "./use-editor-state";

type T = (key: string) => string;
type LooseT = T & { has: (key: string) => boolean };

/**
 * Template-level "نمط تجربة الصفحة" select — shown under the template picker
 * only for the product/category base templates. Writes `theme.pageExperiences`;
 * the real PDP/PLP resolve it, while the editor preview keeps rendering the
 * template's sections (the hint under the select says exactly that).
 */
export function PageExperiencePicker({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as T;
  const experienceT = useTranslations("msg.experience") as unknown as LooseT;
  const tpl = editor.selectedTemplate;
  if (tpl !== "product" && tpl !== "category") return null;

  const options = PAGE_EXPERIENCE_OPTIONS[tpl];
  const stored = editor.draft.pageExperiences?.[tpl];
  const current = isPageExperience(tpl, stored) ? stored : "classic";

  return (
    <div className="space-y-1.5 rounded-lg border p-3">
      <Label htmlFor="page-experience">{t("editor.pageExperience.label")}</Label>
      <Select value={current} onValueChange={(v) => editor.setPageExperience(tpl, v)}>
        <SelectTrigger id="page-experience">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((id) => (
            <SelectItem key={id} value={id}>
              {experienceT.has(id) ? experienceT(id) : id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">{t("editor.pageExperience.hint")}</p>
    </div>
  );
}
