"use client";

import * as React from "react";
import { Check, Copy, Crop, Minimize2, Trash2, TriangleAlert } from "lucide-react";
import type { Media } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { formatNumber } from "@repo/ui/lib/format";
import { cn } from "@repo/ui/lib/cn";
import { HEAVY_IMAGE_BYTES } from "../store-design/quality-audit";

type T = (key: string) => string;

const kb = (bytes: number) => `${formatNumber(Math.max(1, Math.round(bytes / 1024)))} KB`;

/** Grid card: thumbnail + size/usage chips + inline alt edit + crop/compress/copy/delete actions. */
export function MediaCard({
  media,
  used,
  selected,
  selecting,
  onToggleSelect,
  onUpdate,
  onCrop,
  onCompress,
  onCopy,
  onDelete,
  t,
}: {
  media: Media;
  used: boolean;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: () => void;
  onUpdate: (patch: { altAr?: string; altEn?: string }) => void;
  onCrop: () => void;
  onCompress: () => void;
  onCopy: () => void;
  onDelete: () => void;
  t: T;
}) {
  const heavy = media.sizeBytes > HEAVY_IMAGE_BYTES;
  return (
    <div className={cn("relative flex flex-col gap-2 rounded-xl border p-2", selected && "ring-primary ring-2")}>
      <div className={cn("absolute end-3 top-3 z-10", !selecting && !selected && "opacity-0 transition-opacity focus-within:opacity-100 hover:opacity-100")}>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={t("select")} className="bg-background" />
      </div>
      <MediaThumb url={media.url} label={media.altAr ?? media.altEn ?? media.id} className="aspect-square w-full rounded-lg" />
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-muted-foreground num text-[11px]">{kb(media.sizeBytes)}</span>
        {heavy ? (
          <span className="bg-warning/10 text-warning inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
            <TriangleAlert className="size-3" aria-hidden />
            {t("heavy")}
          </span>
        ) : null}
        <span className="text-muted-foreground ms-auto text-[10px]">{used ? t("used") : t("unused")}</span>
      </div>
      <div className="grid gap-1">
        <Input dir="rtl" lang="ar" placeholder={t("altAr")} defaultValue={media.altAr ?? ""} onBlur={(e) => e.target.value !== (media.altAr ?? "") && onUpdate({ altAr: e.target.value })} className="h-7 text-xs" />
        <Input dir="ltr" lang="en" placeholder={t("altEn")} defaultValue={media.altEn ?? ""} onBlur={(e) => e.target.value !== (media.altEn ?? "") && onUpdate({ altEn: e.target.value })} className="h-7 text-xs" />
      </div>
      <div className="flex items-center gap-1">
        {heavy ? (
          <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={onCompress}>
            <Minimize2 aria-hidden />
            {t("compress")}
          </Button>
        ) : null}
        <Button variant="ghost" size="icon-sm" onClick={onCopy} aria-label={t("copyUrl")} title={t("copyUrl")}>
          <Copy aria-hidden />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onCrop} aria-label={t("crop")} title={t("crop")}>
          <Crop aria-hidden />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={onDelete} aria-label={t("delete")}>
          <Trash2 aria-hidden />
        </Button>
        {selected ? <Check className="text-primary size-4" aria-hidden /> : null}
      </div>
    </div>
  );
}
