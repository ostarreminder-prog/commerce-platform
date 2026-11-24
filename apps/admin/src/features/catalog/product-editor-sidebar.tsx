"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Collection, Product } from "@repo/contracts";
import { useBackInStockCount, useDeleteProducts } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { useStatusLabel } from "@repo/ui/components/status-badge";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { toast } from "@repo/ui/components/toaster";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import Link from "@/components/store-link";
import type { Draft } from "@/features/catalog/product-editor-draft";
import { Field } from "@/features/catalog/product-editor-field";

type SetDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

export function SeoCard({ draft, set }: { draft: Draft; set: SetDraft }) {
  const t = useTranslations("catalog.editor");
  const shareImage = draft.media[0];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("seo")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3" dir="ltr">
          {/* eslint-disable-next-line rtl/no-raw-colors -- intentional SERP preview mimicry */}
          <p className="truncate text-sm text-[#1a0dab]">{draft.seoTitle || draft.nameAr || t("seoPreviewTitle")}</p>
          {/* eslint-disable-next-line rtl/no-raw-colors -- intentional SERP preview mimicry */}
          <p className="truncate text-xs text-[#006621]">nakhla.sa/p/{draft.slug || "product-slug"}</p>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{draft.seoDescription || t("seoPreviewDescription")}</p>
        </div>
        {/* Social-share preview — first media + SEO title/desc (og:tags equivalent). */}
        <div className="overflow-hidden rounded-md border">
          {shareImage ? <MediaThumb url={shareImage.url} label={shareImage.alt.ar} className="aspect-[1.91/1] w-full" /> : <div className="bg-muted aspect-[1.91/1] w-full" />}
          <div className="space-y-0.5 p-2.5">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide" dir="ltr">nakhla.sa</p>
            <p className="truncate text-sm font-medium">{draft.seoTitle || draft.nameAr || t("seoPreviewTitle")}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">{draft.seoDescription || t("seoPreviewDescription")}</p>
          </div>
        </div>
        <Field label={t("fields.slug")} htmlFor="p-slug" hint={t("slugHint")}><Input id="p-slug" dir="ltr" className="num" value={draft.slug} onChange={(e) => set("slug", e.target.value)} placeholder="product-slug" /></Field>
        <Field label={t("seoTitle")} htmlFor="seo-title" hint={t("seoTitleHint")}><Input id="seo-title" value={draft.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={60} /></Field>
        <Field label={t("seoDescription")} htmlFor="seo-desc" hint={t("seoDescriptionHint")}><Textarea id="seo-desc" rows={2} value={draft.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={160} /></Field>
      </CardContent>
    </Card>
  );
}

export function AiNotesCard({ draft, set }: { draft: Draft; set: SetDraft }) {
  const t = useTranslations("catalog.editor");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("aiNotes")}</CardTitle></CardHeader>
      <CardContent>
        <Textarea rows={3} value={draft.aiNotes} onChange={(e) => set("aiNotes", e.target.value)} placeholder={t("aiNotesPlaceholder")} aria-label={t("aiNotes")} />
        <p className="text-muted-foreground mt-1.5 text-xs">{t("aiNotesHint")}</p>
      </CardContent>
    </Card>
  );
}

export function OrganizationCard({ draft, set, categories, collections, toggleId, tagInput, setTagInput }: {
  draft: Draft;
  set: SetDraft;
  categories: Category[];
  collections: Collection[];
  toggleId: (key: "categoryIds" | "collectionIds", cid: string) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
}) {
  const t = useTranslations("catalog.editor");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("organization")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label={t("status")}>
          <Select value={draft.status} onValueChange={(v) => set("status", v as Product["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(["draft", "active", "archived"] as const).map((s) => <SelectItem key={s} value={s}>{label("product", "status", s)}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={t("categories")}>
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                <Checkbox checked={draft.categoryIds.includes(c.id)} onCheckedChange={() => toggleId("categoryIds", c.id)} />
                {c.name[locale] ?? c.name.ar}
              </label>
            ))}
          </div>
        </Field>
        <Field label={t("collections")}>
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
            {collections.filter((c) => c.type === "manual").map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                <Checkbox checked={draft.collectionIds.includes(c.id)} onCheckedChange={() => toggleId("collectionIds", c.id)} />
                {c.name[locale] ?? c.name.ar}
              </label>
            ))}
            {!collections.some((c) => c.type === "manual") ? <p className="text-muted-foreground p-1.5 text-xs">{t("noManualCollections")}</p> : null}
          </div>
        </Field>
        <Field label={t("brand")} htmlFor="p-brand"><Input id="p-brand" value={draft.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
        <Field label={t("tags")}>
          <div className="flex flex-wrap gap-1.5">
            {draft.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">{tag}<button type="button" aria-label={t("removeTag")} onClick={() => set("tags", draft.tags.filter((x) => x !== tag))}><X className="size-3" /></button></Badge>
            ))}
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); if (!draft.tags.includes(tagInput.trim())) set("tags", [...draft.tags, tagInput.trim()]); setTagInput(""); } }} placeholder={t("tagPlaceholder")} className="h-7 w-28" />
          </div>
        </Field>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="req-ship" className="font-normal">{t("requiresShipping")}</Label>
          <Switch id="req-ship" checked={draft.requiresShipping} onCheckedChange={(v) => set("requiresShipping", v)} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="taxable" className="font-normal">{t("taxable")}</Label>
          <Switch id="taxable" checked={draft.taxable} onCheckedChange={(v) => set("taxable", v)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductStatsCard({ p }: { p: Product }) {
  const t = useTranslations("catalog.editor");
  const { locale } = useAppLocale();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("stats")}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">{t("sold30d")}</span><span className="num font-medium">{formatNumber(p.stats.sold30d)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("revenue30d")}</span><span className="num font-medium">{formatMoney(p.stats.revenue30d.amount, locale)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("views30d")}</span><span className="num font-medium">{formatNumber(p.stats.views30d)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("conversations30d")}</span><span className="num font-medium">{formatNumber(p.stats.conversations30d)}</span></div>
      </CardContent>
    </Card>
  );
}

/** Waiting count of storefront "أعلمني عند التوفر" signups for this product. */
export function BackInStockCard({ p }: { p: Product }) {
  const t = useTranslations("catalog.editor");
  const { data: waiting = 0 } = useBackInStockCount(p.id);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("backInStock")}</CardTitle></CardHeader>
      <CardContent className="text-sm">
        {waiting > 0 ? <span className="num font-medium">{t("backInStockWaiting", { count: formatNumber(waiting) })}</span> : <span className="text-muted-foreground">{t("backInStockNone")}</span>}
      </CardContent>
    </Card>
  );
}

export function ProductRelatedCard({ p }: { p: Product }) {
  const t = useTranslations("catalog.editor");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("related")}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Link href={`/orders?product=${p.id}`} className="text-primary block hover:underline">{t("ordersWithProduct")}</Link>
        <Link href={`/reviews?product=${p.id}`} className="text-primary block hover:underline">{t("reviewsOf")}</Link>
        <Link href={`/inbox?product=${p.id}`} className="text-primary block hover:underline">{t("conversationsAbout")}</Link>
        <Link href="/inventory" className="text-primary block hover:underline">{t("inventoryScreen")}</Link>
      </CardContent>
    </Card>
  );
}

/** Hard delete (past orders keep their snapshots) — gated by `products.manage` at the call site. */
export function DeleteProductDialog({ p, open, onOpenChange }: { p: Product; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("catalog.editor");
  const { locale } = useAppLocale();
  const mt = useMsgToast();
  const router = useStoreRouter();
  const del = useDeleteProducts();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      titleKey="products.delete.title"
      bodyKey="products.delete.body"
      confirmKey="products.delete.cta"
      params={{ name: p.name[locale] ?? p.name.ar }}
      danger
      pending={del.isPending}
      onConfirm={() =>
        del.mutate([[p.id]], {
          onSuccess: () => { mt.success("products.delete.success"); router.push(recallListUrl("/products")); },
          onError: () => toast.error(t("saveFailed")),
        })
      }
    />
  );
}
