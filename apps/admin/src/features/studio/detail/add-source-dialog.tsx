"use client";

import * as React from "react";
import { FileText, Globe, ListChecks, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NewKnowledge } from "@repo/api-client";
import type { KnowledgeSource } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/cn";
import { Field } from "./shared";

const typeIcons: Partial<Record<KnowledgeSource["type"], React.ComponentType<{ className?: string }>>> = {
  file: FileText,
  faq: ListChecks,
  url: Globe,
};

/** Studio knowledge-tab add-source dialog — file drop / faq pairs / url. */
export function AddSourceDialog({
  open,
  onOpenChange,
  onAdd,
  pending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (s: NewKnowledge) => void;
  pending: boolean;
}) {
  const t = useTranslations("studio.detail.knowledge");
  const [type, setType] = React.useState<NewKnowledge["type"]>("file");
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDetail("");
    }
  }, [open, type]);
  const pickFile = (file?: File) => {
    if (!file) return;
    setTitle(file.name);
    setDetail(
      file.size > 1e6
        ? `${(file.size / 1e6).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1e3))} KB`,
    );
  };
  const valid = title.trim() && detail.trim() && (type !== "url" || /^https?:\/\//.test(detail));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addTitle")}</DialogTitle>
          <DialogDescription>{t("addHint")}</DialogDescription>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <TabsList className="w-full">
            {(["file", "faq", "url"] as const).map((k) => {
              const Icon = typeIcons[k];
              return (
                <TabsTrigger key={k} value={k} className="flex-1">
                  {Icon ? <Icon className="size-4" aria-hidden /> : null} {t(`types.${k}`)}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        {type === "file" ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              drag ? "border-primary bg-primary/5" : "hover:bg-muted/40",
            )}
          >
            <Upload className="text-muted-foreground size-6" aria-hidden />
            <span className="text-sm font-medium">{title || t("drop")}</span>
            <span className="text-muted-foreground text-xs">{detail || t("dropHint")}</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </button>
        ) : (
          <div className="space-y-4">
            <Field label={t("sourceTitle")} htmlFor="kn-title">
              <Input id="kn-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label={type === "url" ? t("url") : t("pairs")} htmlFor="kn-detail">
              <Input
                id="kn-detail"
                dir="ltr"
                value={detail}
                inputMode={type === "faq" ? "numeric" : "url"}
                placeholder={type === "url" ? "https://" : "20"}
                onChange={(e) => setDetail(e.target.value)}
              />
            </Field>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!valid}
            loading={pending}
            onClick={() => onAdd({ type, title: title.trim(), detail: detail.trim() })}
          >
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
