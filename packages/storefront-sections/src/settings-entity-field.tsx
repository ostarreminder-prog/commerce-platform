"use client";

import { Checkbox } from "@repo/ui/components/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import type { FieldMeta } from "./types";
import { useSectionData } from "./data-context";
import { FieldRow, useFieldLabels } from "./settings-form-helpers";

/**
 * Entity pickers for block settings (flat `Record<string, string>`):
 * `entity-ref` stores a single id; `entity-list` serializes ids comma-joined.
 */
export function BlockEntityField({
  field,
  label,
  value,
  onChange,
}: {
  field: FieldMeta;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t, locale } = useFieldLabels();
  const { products, categories } = useSectionData();
  const items = field.entity === "category" ? categories : products;

  if (field.kind === "entity-ref") {
    return (
      <FieldRow label={label}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("pickEntity")} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name[locale] ?? item.name.ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
    );
  }

  const selected = value.split(",").filter(Boolean);
  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...selected, id].join(",") : selected.filter((x) => x !== id).join(","));

  return (
    <FieldRow label={label}>
      <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border p-2">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label key={item.id} className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
              <Checkbox checked={checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
              <span className="line-clamp-1">{item.name[locale] ?? item.name.ar}</span>
            </label>
          );
        })}
        {!items.length ? <p className="text-muted-foreground px-2 py-3 text-xs">{t("noEntities")}</p> : null}
      </div>
    </FieldRow>
  );
}
