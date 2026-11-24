"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageField } from "@repo/ui/components/image-field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { blockDef, type BlockRegistryEntry } from "./blocks";
import type { FieldMeta, SectionBlock } from "./types";
import { useMediaAdapter } from "./media-context";
import { BlockEntityField } from "./settings-entity-field";
import { FieldRow, useFieldLabels } from "./settings-form-helpers";

/** One field inside a repeatable block (block settings are flat Record<string, string>). */
function BlockField({
  field,
  block,
  onChange,
}: {
  field: FieldMeta;
  block: SectionBlock;
  onChange: (settings: Record<string, string>) => void;
}) {
  const { t } = useFieldLabels();
  const media = useMediaAdapter();
  const label = t.has(`fields.${field.labelKey}`) ? t(`fields.${field.labelKey}`) : field.key;
  const value = block.settings[field.key] ?? "";
  const set = (key: string, v: string) => onChange({ ...block.settings, [key]: v });

  switch (field.kind) {
    case "localized":
      return (
        <div className="grid gap-1.5">
          <Input dir="rtl" placeholder={`${label} — ${t("arabic")}`} value={block.settings[`${field.key}Ar`] ?? ""} onChange={(e) => set(`${field.key}Ar`, e.target.value)} />
          <Input dir="ltr" placeholder={`${label} — ${t("english")}`} value={block.settings[`${field.key}En`] ?? ""} onChange={(e) => set(`${field.key}En`, e.target.value)} />
        </div>
      );
    case "number":
      return (
        <FieldRow label={label}>
          <Input type="number" min={field.min} max={field.max} value={value} onChange={(e) => set(field.key, e.target.value)} />
        </FieldRow>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between gap-3">
          <Label>{label}</Label>
          <Switch checked={value === "true"} onCheckedChange={(v) => set(field.key, v ? "true" : "false")} />
        </div>
      );
    case "select":
      return (
        <FieldRow label={label}>
          <Select value={value} onValueChange={(v) => set(field.key, v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t.has(`options.${o.value}`) ? t(`options.${o.value}`) : o.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      );
    case "image":
      if (!media) {
        return (
          <FieldRow label={label}>
            <Input dir="ltr" placeholder="https://…" value={value} onChange={(e) => set(field.key, e.target.value)} />
          </FieldRow>
        );
      }
      return (
        <FieldRow label={label}>
          <ImageField
            value={value}
            images={media.images}
            uploading={media.uploading}
            onSelect={(m) => set(field.key, m.url)}
            onUpload={
              media.upload
                ? (file) => {
                    void Promise.resolve(media.upload?.(file)).then((m) => {
                      if (m && typeof m === "object" && "url" in m) set(field.key, m.url);
                    });
                  }
                : undefined
            }
            onCropResult={(d) => set(field.key, d)}
            onRemove={() => set(field.key, "")}
          />
        </FieldRow>
      );
    case "entity-ref":
    case "entity-list":
      return <BlockEntityField field={field} label={label} value={value} onChange={(v) => set(field.key, v)} />;
    default:
      return (
        <FieldRow label={label}>
          <Input value={value} onChange={(e) => set(field.key, e.target.value)} />
        </FieldRow>
      );
  }
}

/** Fields for a block — explicit `field.blockFields` win, otherwise the block registry's. */
function fieldsFor(field: FieldMeta, block: SectionBlock): FieldMeta[] {
  if (field.blockFields?.length) return field.blockFields;
  return blockDef(block.type)?.fields ?? [];
}

/** Block types the add-menu offers — `blockTypes` palette or the single `blockType`. */
function allowedTypes(field: FieldMeta): string[] {
  if (field.blockTypes?.length) return field.blockTypes;
  return field.blockType ? [field.blockType] : [];
}

/** Repeatable-block editor — add/remove/reorder blocks and edit their settings. */
export function BlocksEditor({
  field,
  blocks,
  onChange,
}: {
  field: FieldMeta;
  blocks: SectionBlock[];
  onChange: (blocks: SectionBlock[]) => void;
}) {
  const { t } = useFieldLabels();
  const tMsg = useTranslations("msg") as unknown as (key: string) => string;
  const seq = React.useRef(0);
  const label = t.has(`fields.${field.labelKey}`) ? t(`fields.${field.labelKey}`) : field.key;
  const types = allowedTypes(field);
  const multi = types.length > 1;
  const maxed = typeof field.max === "number" && blocks.length >= field.max;

  const update = (i: number, settings: Record<string, string>) =>
    onChange(blocks.map((b, n) => (n === i ? { ...b, settings } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(i, 1);
    if (item) next.splice(j, 0, item);
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, n) => n !== i));
  const add = (type: string, entry?: BlockRegistryEntry) =>
    onChange([
      ...blocks,
      { id: `blk_${Date.now().toString(36)}${(seq.current++).toString(36)}`, type, settings: { ...(entry?.defaults ?? {}) } },
    ]);
  const blockLabel = (b: SectionBlock) => (blockDef(b.type) ? tMsg(`blockType.${b.type}`) : b.type);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {!maxed ? (
          multi ? (
            <Select value="" onValueChange={(type) => add(type, blockDef(type))}>
              <SelectTrigger className="h-8 w-auto gap-1.5 text-xs" aria-label={t("addItem")}>
                <Plus className="size-3.5" aria-hidden />
                <SelectValue placeholder={t("addItem")} />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {tMsg(`blockType.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button
              type="button"
              onClick={() => add(types[0] ?? "block", blockDef(types[0] ?? ""))}
              className="border-input hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
            >
              <Plus className="size-3.5" aria-hidden />
              {t("addItem")}
            </button>
          )
        ) : null}
      </div>
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div key={b.id} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                {blockLabel(b)} {multi ? "" : i + 1}
              </span>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="hover:bg-accent inline-flex size-7 items-center justify-center rounded-md disabled:opacity-40" aria-label={t("moveUp")}>
                  <ArrowUp className="size-3.5" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="hover:bg-accent inline-flex size-7 items-center justify-center rounded-md disabled:opacity-40" aria-label={t("moveDown")}>
                  <ArrowDown className="size-3.5" aria-hidden />
                </button>
                <button type="button" onClick={() => remove(i)} className="text-destructive hover:bg-destructive/10 inline-flex size-7 items-center justify-center rounded-md" aria-label={t("removeItem")}>
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
            {fieldsFor(field, b).map((bf) => (
              <BlockField key={bf.key} field={bf} block={b} onChange={(settings) => update(i, settings)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
