"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCreateKnowledge, useUpdateKnowledge } from "@repo/api-client";
import type { KnowledgeSource } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { useStoreRouter } from "@/lib/store-route";

const TYPES: KnowledgeSource["type"][] = ["file", "url", "faq", "policy", "product_catalog", "text"];

export function AddSourceDialog({ open, onOpenChange, source }: { open: boolean; onOpenChange: (v: boolean) => void; source?: KnowledgeSource | null }) {
  const mt = useMsgToast();
  const t = useTranslations("knowledge.add");
  const tc = useTranslations("common");
  const create = useCreateKnowledge();
  const update = useUpdateKnowledge();
  const router = useStoreRouter();
  const editing = Boolean(source);
  const [type, setType] = React.useState<KnowledgeSource["type"]>("file");
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setType(source?.type ?? "file");
    setTitle(source?.title ?? "");
    setDetail(source ? (source.url ?? source.faq[0]?.a ?? source.file?.name ?? "") : "");
  }, [open, source]);

  const dupeError = (e: unknown) => {
    if ((e as Error).message === "duplicate_title") mt.error("knowledge.duplicate");
    else mt.error("knowledge.saveFailed");
  };

  const submit = () => {
    if (!title.trim()) return;
    if (editing && source) {
      update.mutate([source.id, { title: title.trim(), detail: detail.trim() }], {
        onSuccess: () => {
          mt.success("knowledge.updated", { title: title.trim() });
          onOpenChange(false);
        },
        onError: dupeError,
      });
    } else {
      create.mutate([{ type, title: title.trim(), detail: detail.trim() }], {
        onSuccess: (s) => {
          mt.success("knowledge.uploaded", { title: s.title });
          onOpenChange(false);
          router.push(`/knowledge/${s.id}`);
        },
        onError: dupeError,
      });
    }
  };
  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("editTitle") : t("title")}</DialogTitle>
          <DialogDescription>{editing ? t("editDescription") : t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!editing ? (
            <div className="space-y-1.5">
              <Label>{t("type")}</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as KnowledgeSource["type"])} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TYPES.map((k) => (
                  <Label key={k} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border p-2 text-xs", type === k && "border-primary bg-primary/5")}>
                    <RadioGroupItem value={k} />
                    {t(`types.${k}`)}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="kn-title">{t("name")}</Label>
            <Input id="kn-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {type === "file" ? (
            <div className="space-y-1.5">
              <Label htmlFor="kn-file">{t("file")}</Label>
              <Input id="kn-file" type="file" accept=".pdf,.txt,.md,.csv" onChange={(e) => setDetail(e.target.files?.[0]?.name ?? "")} />
            </div>
          ) : type === "url" || type === "policy" ? (
            <div className="space-y-1.5">
              <Label htmlFor="kn-url">{t("url")}</Label>
              <Input id="kn-url" dir="ltr" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="https://…" />
            </div>
          ) : type === "faq" || type === "text" ? (
            <div className="space-y-1.5">
              <Label htmlFor="kn-faq">{type === "faq" ? t("faqAnswer") : t("textContent")}</Label>
              <Textarea id="kn-faq" rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>
            {editing ? t("save") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
