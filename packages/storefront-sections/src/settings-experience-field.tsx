"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { EXPERIENCE_IDS, isExperienceId } from "./experiences/types";
import { FieldRow, type LooseT } from "./settings-form-helpers";

/** `select` field whose options come from the commerce experience registry (`optionsSource: "experiences"`). */
export function ExperienceSelectField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const experienceT = useTranslations("msg.experience") as unknown as LooseT;
  return (
    <FieldRow label={label}>
      <Select value={isExperienceId(value) ? value : "adaptive-grid"} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EXPERIENCE_IDS.map((id) => (
            <SelectItem key={id} value={id}>
              {experienceT.has(id) ? experienceT(id) : id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
