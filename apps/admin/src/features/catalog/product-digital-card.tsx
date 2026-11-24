"use client";

import * as React from "react";
import { FileDown, Link2, Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDigitalAssets, useSaveDigitalAssets } from "@repo/api-client";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";

interface AssetDraft { name: string; kind: "file" | "link"; url: string }

/** Digital delivery files — only rendered for products with `requiresShipping = false`. */
export function ProductDigitalCard({ productId }: { productId: string }) {
  const t = useTranslations("catalog.editor");
  const mt = useMsgToast();
  const assets = useDigitalAssets(productId);
  const save = useSaveDigitalAssets();
  const [rows, setRows] = React.useState<AssetDraft[] | null>(null);

  React.useEffect(() => {
    if (assets.data && rows === null) setRows(assets.data.map((a) => ({ name: a.name, kind: a.kind, url: a.url })));
  }, [assets.data, rows]);

  const submit = () => {
    if (!rows) return;
    if (rows.some((r) => !r.name.trim() || !r.url.trim())) { toast.error(t("digitalIncomplete")); return; }
    save.mutate([productId, rows.map((r) => ({ variantId: null, name: r.name.trim(), kind: r.kind, mediaId: null, url: r.url.trim(), sizeBytes: null }))], {
      onSuccess: () => mt.success("digital.saved"),
      onError: () => mt.error("common.save.error"),
    });
  };

  const list = rows ?? [];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileDown className="size-4" aria-hidden /> {t("digitalTitle")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Banner variant="info">{t("digitalNote")}</Banner>
        {list.map((r, i) => (
          <div key={i} className="grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[8rem_1fr_1.5fr_2rem]">
            <div className="space-y-1">
              <Label className="text-xs">{t("digitalKind")}</Label>
              <Select value={r.kind} onValueChange={(v) => setRows(list.map((x, j) => (j === i ? { ...x, kind: v as "file" | "link" } : x)))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="file"><span className="flex items-center gap-1"><FileDown className="size-3.5" aria-hidden /> {t("digitalFile")}</span></SelectItem>
                  <SelectItem value="link"><span className="flex items-center gap-1"><Link2 className="size-3.5" aria-hidden /> {t("digitalLink")}</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("digitalName")}</Label>
              <Input value={r.name} onChange={(e) => setRows(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("digitalUrl")}</Label>
              <Input dir="ltr" value={r.url} onChange={(e) => setRows(list.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://…" />
            </div>
            <Button variant="ghost" size="icon" aria-label={t("digitalRemove")} onClick={() => setRows(list.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRows([...list, { name: "", kind: "link", url: "" }])}><Plus className="size-3.5" aria-hidden /> {t("digitalAdd")}</Button>
          <Button size="sm" onClick={submit} disabled={save.isPending}><Save className="size-3.5" aria-hidden /> {t("digitalSave")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
