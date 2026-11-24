"use client";

import * as React from "react";
import { ImagePlus, Images, Trash2, X } from "lucide-react";
import { useActiveTheme, useDeleteMedia, useMediaList, useUpdateMedia, useUploadMedia } from "@repo/api-client";
import type { Media } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { ImageCropDialog } from "@repo/ui/components/image-crop-dialog";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/lib/cn";
import { compressImage } from "./compress-image";
import { MediaCard } from "./media-card";

type T = (key: string, params?: Record<string, unknown>) => string;
type Filter = "all" | "images" | "video" | "used" | "unused";
const FILTERS: Filter[] = ["all", "images", "video", "used", "unused"];

/** Media library: drag-drop multi upload, search, filters, select, crop, alt edit, copy url, >500KB compress. */
export function MediaLibraryView() {
  const t = useTranslations("mediaLibrary") as unknown as T;
  const strictT = useMsg();
  const tm = strictT as unknown as T;
  const mt = useMsgToast();
  const mediaQuery = useMediaList();
  const media = mediaQuery.data ?? [];
  const { data: theme } = useActiveTheme();
  const upload = useUploadMedia();
  const update = useUpdateMedia();
  const remove = useDeleteMedia();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [dragOver, setDragOver] = React.useState(false);
  const [cropTarget, setCropTarget] = React.useState<Media | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = React.useState<Media | null>(null);
  const [bulkDelete, setBulkDelete] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  /* Loose "used" tracking — the media url appears somewhere in the active theme. */
  const themeJson = React.useMemo(() => (theme ? JSON.stringify(theme) : ""), [theme]);
  const isUsed = React.useCallback((m: Media) => themeJson.includes(m.url), [themeJson]);

  const uploadFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) =>
      upload.mutate([file], {
        onError: (e) => mt.error(e.message === "size" ? "media.uploadSize" : "media.uploadType", { name: file.name }),
      }),
    );
  };

  const compress = async (m: Media) => {
    try {
      const out = await compressImage(m);
      update.mutate([m.id, { url: out.url, width: out.width, height: out.height, sizeBytes: out.sizeBytes, mime: "image/jpeg" }], {
        onSuccess: () => mt.success("media.compressed"),
      });
    } catch {
      mt.error("common.save.error");
    }
  };

  const copyUrl = (m: Media) => {
    void navigator.clipboard?.writeText(m.url).then(() => mt.success("common.copy.success")).catch(() => mt.error("common.save.error"));
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirmDelete = (items: Media[]) => {
    Promise.all(items.map((m) => remove.mutateAsync([m.id]))).then(
      () => {
        mt.success("media.deleted", { count: items.length });
        setSelected(new Set());
        setDeleteTarget(null);
        setBulkDelete(false);
      },
      () => mt.error("common.save.error"),
    );
  };

  const filtered = media.filter((m) => {
    if (filter === "images" && !m.mime.startsWith("image/")) return false;
    if (filter === "video" && !m.mime.startsWith("video/")) return false;
    if (filter === "used" && !isUsed(m)) return false;
    if (filter === "unused" && isUsed(m)) return false;
    const hay = `${m.altAr ?? ""} ${m.altEn ?? ""} ${m.url}`.toLowerCase();
    return !query.trim() || hay.includes(query.trim().toLowerCase());
  });
  const selectedItems = filtered.filter((m) => selected.has(m.id));
  const selectedUsed = selectedItems.filter(isUsed).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center",
          dragOver ? "border-primary bg-accent" : "text-muted-foreground",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <ImagePlus className="size-8" aria-hidden />
        <p className="text-sm font-medium">{upload.isPending ? tm("media.uploading") : t("dropzone")}</p>
        <p className="text-xs">{t("dropzoneHint")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="w-64" />
        <div className="bg-muted inline-flex rounded-md p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn("rounded px-3 py-1 text-xs font-medium", filter === f ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>
        {selected.size > 0 ? (
          <div className="ms-auto flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{t("selected", { count: selected.size })}</span>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setBulkDelete(true)}>
              <Trash2 aria-hidden />
              {t("deleteSelected")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X aria-hidden />
              {t("deselect")}
            </Button>
          </div>
        ) : null}
      </div>
      <DataState
        state={mediaQuery}
        loading={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        }
      >
        {() =>
          filtered.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((m) => (
                <MediaCard
                  key={m.id}
                  media={m}
                  used={isUsed(m)}
                  selected={selected.has(m.id)}
                  selecting={selected.size > 0}
                  onToggleSelect={() => toggleSelect(m.id)}
                  onUpdate={(patch) => update.mutate([m.id, patch])}
                  onCrop={() => setCropTarget(m)}
                  onCompress={() => void compress(m)}
                  onCopy={() => copyUrl(m)}
                  onDelete={() => setDeleteTarget(m)}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center">
              <Images className="size-8" aria-hidden />
              <p className="text-sm">{t("empty")}</p>
            </div>
          )
        }
      </DataState>
      <ImageCropDialog
        open={cropTarget !== null}
        src={cropTarget?.url ?? ""}
        onDone={(dataUrl) => {
          if (cropTarget) update.mutate([cropTarget.id, { url: dataUrl, sizeBytes: Math.round((dataUrl.length * 3) / 4), mime: "image/jpeg" }]);
          setCropTarget(null);
        }}
        onClose={() => setCropTarget(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        titleKey="media.delete.title"
        bodyKey={deleteTarget && isUsed(deleteTarget) ? "media.delete.usedBody" : "media.delete.body"}
        confirmKey="media.delete.confirm"
        danger
        pending={remove.isPending}
        onConfirm={() => deleteTarget && confirmDelete([deleteTarget])}
      />
      <ConfirmDialog
        open={bulkDelete}
        onOpenChange={setBulkDelete}
        titleKey="media.delete.bulkTitle"
        bodyKey={selectedUsed > 0 ? "media.delete.usedBody" : "media.delete.body"}
        confirmKey="media.delete.confirm"
        params={{ count: selectedItems.length }}
        danger
        pending={remove.isPending}
        onConfirm={() => confirmDelete(selectedItems)}
      />
    </div>
  );
}
