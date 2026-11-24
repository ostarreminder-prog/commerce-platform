"use client";

import * as React from "react";
import { History, Monitor, RefreshCw, Smartphone, Tablet, Unplug, X } from "lucide-react";
import type { ThemeDevice } from "@repo/contracts";
import { useSectionData, type PreviewEntity, type PreviewPersona } from "@repo/storefront-sections";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { formatDateTime } from "@repo/ui/lib/format";
import { cn } from "@repo/ui/lib/cn";
import { PREVIEW_URL } from "./editor-messages";
import type { EditorController } from "./use-editor-state";

const DEVICES: { id: ThemeDevice; icon: typeof Monitor; width: string }[] = [
  { id: "mobile", icon: Smartphone, width: "390px" },
  { id: "tablet", icon: Tablet, width: "768px" },
  { id: "desktop", icon: Monitor, width: "100%" },
];
const PERSONAS: PreviewPersona[] = ["guest", "customer", "with-cart"];

/** Entity dropdown above the preview — the picked entity type follows the active template. */
function EntityPicker({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const { products, categories, pages } = useSectionData();
  const tpl = editor.selectedTemplate;
  const entityType: PreviewEntity["type"] | null =
    tpl === "product" ? "product" : tpl === "category" ? "category" : tpl === "page" ? "page" : null;
  if (!entityType) return null;
  const items =
    entityType === "product" ? products : entityType === "category" ? categories : (pages ?? []);
  const labelOf = (item: { id: string; name?: { ar: string; en?: string }; title?: { ar: string; en?: string } }) =>
    (item.name ?? item.title)?.[locale] ?? (item.name ?? item.title)?.ar ?? item.id;
  const value = editor.previewEntity?.type === entityType ? editor.previewEntity.id : "";
  return (
    <Select value={value} onValueChange={(id) => editor.setPreviewEntity({ type: entityType, id })}>
      <SelectTrigger className="h-8 w-40 text-xs" aria-label={t(`editor.fields.${entityType}Id`)}>
        <SelectValue placeholder={t(`editor.fields.${entityType}Id`)} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {labelOf(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Center column: entity + persona pickers, device toggle, live preview iframe. */
export function EditorPreview({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const device = editor.device;
  const width = DEVICES.find((d) => d.id === device)?.width ?? "100%";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {editor.versionPreview ? (
        <Banner
          variant="warning"
          title={t("editor.versionPreview.banner")}
          action={
            <Button size="sm" variant="outline" onClick={editor.exitVersionPreview}>
              <X aria-hidden />
              {t("editor.versionPreview.exit")}
            </Button>
          }
        >
          <span className="num text-xs">
            <History className="me-1 inline size-3" aria-hidden />
            {formatDateTime(editor.versionPreview.at, locale)}
          </span>
        </Banner>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm font-medium">{t("editor.preview")}</span>
        <div className="flex items-center gap-2">
          <EntityPicker editor={editor} />
          <Select value={editor.persona} onValueChange={(v) => editor.setPersona(v as PreviewPersona)}>
            <SelectTrigger className="h-8 w-36 text-xs" aria-label={t("editor.persona.label")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSONAS.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`editor.persona.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="bg-muted inline-flex rounded-md p-1">
            {DEVICES.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={device === id}
                aria-label={t(`editor.device.${id}`)}
                title={t(`editor.device.${id}`)}
                onClick={() => editor.setDevice(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium",
                  device === id ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="max-sm:hidden">{t(`editor.device.${id}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-muted/40 flex h-[70vh] min-h-[480px] justify-center overflow-auto rounded-xl border p-3 sm:p-5">
        <div
          className="bg-background relative h-full overflow-hidden rounded-lg border shadow-xl transition-[width] duration-200"
          style={{ width, maxWidth: "100%" }}
        >
          <iframe
            key={editor.previewFrameKey}
            ref={iframeRef}
            src={PREVIEW_URL}
            title={t("editor.preview")}
            className="size-full border-0"
            onLoad={() => editor.bindPreview(iframeRef.current?.contentWindow ?? null)}
          />
          {editor.previewFailed ? (
            <div className="bg-background/95 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Unplug className="text-muted-foreground size-8" aria-hidden />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("editor.previewFailed")}</p>
                <p className="text-muted-foreground max-w-64 text-xs">{t("editor.previewFailedHint")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={editor.retryPreview}>
                <RefreshCw aria-hidden />
                {t("editor.retryPreview")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
