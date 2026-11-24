"use client";

import * as React from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "./button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "../lib/cn";

export type CropAspect = "free" | "1:1" | "16:9" | "4:3";

const RATIOS: Record<Exclude<CropAspect, "free">, number> = { "1:1": 1, "16:9": 16 / 9, "4:3": 4 / 3 };
const ASPECTS: { value: CropAspect; labelKey: string }[] = [
  { value: "free", labelKey: "aspect.free" },
  { value: "1:1", labelKey: "aspect.square" },
  { value: "16:9", labelKey: "aspect.wide" },
  { value: "4:3", labelKey: "aspect.classic" },
];

export interface ImageCropDialogProps {
  open: boolean;
  /** Source image url (data:/https:/blob:). */
  src: string;
  /** Initial aspect preset. */
  aspect?: CropAspect;
  /** Receives the cropped `image/jpeg` dataURL. */
  onDone: (dataUrl: string) => void;
  onClose: () => void;
}

/**
 * Canvas crop dialog — zoom slider, drag pan, aspect presets and rotation.
 * Self-contained (no external crop lib); output is `canvas.toDataURL("image/jpeg", 0.9)`.
 */
export function ImageCropDialog({ open, src, aspect: initialAspect = "free", onDone, onClose }: ImageCropDialogProps) {
  const t = useTranslations("msg") as unknown as (key: string) => string;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const dragRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [ready, setReady] = React.useState(false);
  const [aspect, setAspect] = React.useState<CropAspect>(initialAspect);
  const [zoom, setZoom] = React.useState(1);
  const [rot, setRot] = React.useState(0);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!open || !src) return;
    setReady(false);
    setZoom(1);
    setRot(0);
    setOffset({ x: 0, y: 0 });
    setAspect(initialAspect);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = src;
  }, [open, src, initialAspect]);

  const img = ready ? imgRef.current : null;
  const swap = rot % 2 === 1;
  const effW = img ? (swap ? img.naturalHeight : img.naturalWidth) : 1;
  const effH = img ? (swap ? img.naturalWidth : img.naturalHeight) : 1;
  const ar = aspect === "free" ? effW / (effH || 1) : RATIOS[aspect];
  const viewW = 360;
  const viewH = Math.round(Math.min(360, Math.max(120, viewW / (ar || 1))));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewW * dpr;
    canvas.height = viewH * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, viewW, viewH);
    const scale = Math.max(viewW / effW, viewH / effH) * zoom;
    ctx.translate(viewW / 2 + offset.x, viewH / 2 + offset.y);
    ctx.rotate((rot * Math.PI) / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  }, [img, zoom, rot, offset, viewW, viewH, effW, effH]);

  const done = () => {
    const canvas = canvasRef.current;
    if (canvas) onDone(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("media.crop")}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t("media.crop")}
            className={cn("border-border max-w-full cursor-grab touch-none rounded-lg border", !ready && "bg-muted animate-pulse")}
            style={{ width: viewW, height: viewH }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (d) setOffset({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y });
            }}
            onPointerUp={() => (dragRef.current = null)}
            onPointerCancel={() => (dragRef.current = null)}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground w-16 shrink-0 text-xs">{t("media.zoom")}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="accent-primary w-full"
              aria-label={t("media.zoom")}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {ASPECTS.map((a) => (
                <Button key={a.value} type="button" size="sm" variant={aspect === a.value ? "default" : "outline"} onClick={() => setAspect(a.value)}>
                  {t(`media.${a.labelKey}`)}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="outline" onClick={() => setRot((r) => (r + 3) % 4)} aria-label={t("media.rotate")}>
                <RotateCcw className="size-4" aria-hidden />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={() => setRot((r) => (r + 1) % 4)} aria-label={t("media.rotate")}>
                <RotateCw className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={done} disabled={!ready}>
            {t("media.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
