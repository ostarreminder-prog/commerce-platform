"use client";

import * as React from "react";
import { ExternalLink, Save, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  useCategoryList, useCollectionList, useInventoryLevels, useOrderList, useProductById, useProductList, useSaveProduct, type ProductInput,
} from "@repo/api-client";
import type { MediaRef, Product } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { useUnsavedGuard } from "@/lib/unsaved-guard";
import { recallListUrl } from "@/lib/url-state";
import { toHalalas } from "@repo/ui/lib/money";
import { blank, draftStore, fromProduct, type Draft, type VariantDraft } from "@/features/catalog/product-editor-draft";
import { Field } from "@/features/catalog/product-editor-field";
import { MediaCard } from "@/features/catalog/product-editor-media";
import { OptionsVariantsCard } from "@/features/catalog/product-editor-variants";
import { AiNotesCard, BackInStockCard, DeleteProductDialog, OrganizationCard, ProductRelatedCard, ProductStatsCard, SeoCard } from "@/features/catalog/product-editor-sidebar";
import { ProductDigitalCard } from "@/features/catalog/product-digital-card";

export function ProductEditor() {
  const t = useTranslations("catalog.editor");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useParams<{ id?: string }>();
  const id = params.id ?? null;
  const isNew = !id;
  const canManage = useCan("products.manage");
  const product = useProductById(id ?? "");
  const allProducts = useProductList();
  const orders = useOrderList();
  const categories = useCategoryList();
  const collections = useCollectionList();
  const levels = useInventoryLevels();
  const mt = useMsgToast();
  const save = useSaveProduct();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [tagInput, setTagInput] = React.useState("");
  const [bulk, setBulk] = React.useState<Set<string>>(new Set());
  const [drag, setDrag] = React.useState<number | null>(null);

  /* New-product drafts persist to sessionStorage so an accidental reload or
   * detour doesn't lose the form ("draft save" lifecycle step). Restored
   * silently with a toast; cleared on successful save. */
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (isNew) {
      const restored = restoredRef.current ? null : draftStore.load();
      restoredRef.current = true;
      setDraft((d) => d ?? restored ?? blank);
      if (restored) toast(t("draftRestored"));
    } else if (product.data) setDraft((d) => d ?? fromProduct(product.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, product.data]);

  React.useEffect(() => {
    if (isNew && draft) draftStore.save(draft);
  }, [isNew, draft]);

  /** Variants that already appear in orders — deleting them gets a warning. */
  const orderedVariantIds = React.useMemo(
    () => new Set((orders.data ?? []).flatMap((o) => o.items.map((i) => i.variantId))),
    [orders.data],
  );

  const dirty = React.useMemo(() => {
    if (!draft) return false;
    if (isNew) return draft.nameAr.trim().length > 0 || draft.media.length > 0;
    return product.data ? JSON.stringify(draft) !== JSON.stringify(fromProduct(product.data)) : false;
  }, [draft, isNew, product.data]);
  const unsavedDialog = useUnsavedGuard(dirty);

  if (!isNew && product.isPending) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>;
  }
  if (!isNew && (product.isError || !product.data)) {
    return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/products"))}>{t("backToList")}</Button>} /></Card>;
  }
  if (!draft) return null;
  const p = product.data ?? null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });
  const setVariant = (vid: string, patch: Partial<VariantDraft>) =>
    set("variants", draft.variants.map((v) => (v.id === vid ? { ...v, ...patch } : v)));
  const stockFor = (v: VariantDraft) => (levels.data ?? []).filter((l) => l.variantId === v.id).reduce((s, l) => s + l.available, 0);
  const moveMedia = (i: number, dir: -1 | 1) => {
    const next = [...draft.media];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]] as [MediaRef, MediaRef];
    set("media", next);
  };

  const aiDescribe = () => {
    const name = draft.nameAr || "المنتج";
    set("descriptionAr", `${name} — قطعة مختارة بعناية من تشكيلة نخلة. جودة عالية، تغليف أنيق، وتوصيل سريع لكل مناطق المملكة خلال 1-3 أيام عمل. مثالي للإهداء أو للاستخدام اليومي.`);
    if (!draft.descriptionEn) set("descriptionEn", `${draft.nameEn || "This product"} — carefully selected from the Nakhla collection. Premium quality, elegant packaging, and fast delivery across Saudi Arabia within 1-3 business days.`);
    toast.success(t("aiDone"));
  };

  const submit = () => {
    if (!draft.nameAr.trim() || draft.nameAr.trim().length < 2) { toast.error(t("nameRequired")); return; }
    if (!draft.variants.length) { toast.error(t("priceRequired")); return; }
    /* Price fields must parse to real numbers — a non-numeric string used to
     * slip through (`Number("abc") <= 0` is false) and save NaN prices. */
    if (draft.variants.some((v) => !v.price.trim() || !Number.isFinite(Number(v.price)) || Number(v.price) <= 0)) { toast.error(t("priceRequired")); return; }
    if (draft.variants.some((v) =>
      (v.compareAtPrice.trim() && !Number.isFinite(Number(v.compareAtPrice))) ||
      (v.cost.trim() && !Number.isFinite(Number(v.cost))))) { toast.error(t("priceInvalid")); return; }
    /* Publish guard (spec §13): an active product needs the same completeness
     * as a draft save — blocked here with a clear per-field error. */
    /* Duplicate SKU/barcode — inside the draft and against other products. */
    const seen = new Map<string, "sku" | "barcode">();
    for (const v of draft.variants) {
      const sku = v.sku.trim().toLowerCase();
      const bc = v.barcode.trim().toLowerCase();
      if (sku) { if (seen.get(sku) === "sku") { toast.error(t("duplicateSku", { value: v.sku.trim() })); return; } seen.set(sku, "sku"); }
      if (bc) { if (seen.get(bc) === "barcode") { toast.error(t("duplicateBarcode", { value: v.barcode.trim() })); return; } seen.set(bc, "barcode"); }
    }
    const other = (allProducts.data ?? []).filter((x) => x.id !== p?.id).flatMap((x) => x.variants);
    for (const v of draft.variants) {
      const sku = v.sku.trim().toLowerCase();
      if (sku && other.some((o) => o.sku.toLowerCase() === sku)) { toast.error(t("duplicateSku", { value: v.sku.trim() })); return; }
      const bc = v.barcode.trim().toLowerCase();
      if (bc && other.some((o) => (o.barcode ?? "").toLowerCase() === bc)) { toast.error(t("duplicateBarcode", { value: v.barcode.trim() })); return; }
    }
    const input: ProductInput = {
      id: p?.id,
      slug: draft.slug.trim() || undefined,
      name: { ar: draft.nameAr.trim(), en: draft.nameEn.trim() || undefined },
      description: { ar: draft.descriptionAr, en: draft.descriptionEn || undefined },
      shortDescription: { ar: draft.shortDescriptionAr },
      status: draft.status,
      categoryIds: draft.categoryIds,
      collectionIds: draft.collectionIds.filter((cid) => collections.data?.find((c) => c.id === cid)?.type === "manual"),
      brand: draft.brand.trim() || null,
      tags: draft.tags,
      requiresShipping: draft.requiresShipping,
      taxable: draft.taxable,
      aiNotes: draft.aiNotes,
      seo: { title: draft.seoTitle || draft.nameAr, description: draft.seoDescription },
      media: draft.media,
      options: draft.options
        .map((o) => ({ name: { ar: o.nameAr.trim() }, values: o.values.split(/[،,]/).map((s) => ({ ar: s.trim() })).filter((v) => v.ar) }))
        .filter((o) => o.name.ar && o.values.length) as Product["options"],
      variants: draft.variants.map((v) => ({
        id: v.id, optionValues: v.optionValues, sku: v.sku || v.id, barcode: v.barcode || null,
        price: { amount: toHalalas(v.price), currency: "SAR" },
        compareAtPrice: v.compareAtPrice ? { amount: toHalalas(v.compareAtPrice), currency: "SAR" } : null,
        cost: v.cost ? { amount: toHalalas(v.cost), currency: "SAR" } : null,
        weightGrams: Number(v.weightGrams) || 0, dimensionsCm: null, trackInventory: true, allowBackorder: false, imageId: v.imageId,
      })),
    };
    save.mutate([input], {
      onSuccess: (saved) => { draftStore.clear(); mt.success(isNew ? "products.created" : "products.saved", { name: saved.name[locale] ?? saved.name.ar }); router.push(`/products/${saved.id}`); },
      onError: () => toast.error(t("saveFailed")),
    });
  };

  const toggleId = (key: "categoryIds" | "collectionIds", cid: string) =>
    set(key, draft[key].includes(cid) ? draft[key].filter((x) => x !== cid) : [...draft[key], cid]);

  return (
    <div className="space-y-6 pb-24">
      <Breadcrumbs items={[{ label: t("crumbProducts"), href: recallListUrl("/products") }, { label: p ? (p.name[locale] ?? p.name.ar) : t("newProduct") }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{p ? (p.name[locale] ?? p.name.ar) : t("newProduct")}</h1>
          {p ? <StatusBadge entity="product" value={p.status} /> : null}
        </div>
        <div className="flex items-center gap-2">
          {p ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`http://localhost:3001/p/${p.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />{t("viewInStore")}
              </a>
            </Button>
          ) : null}
          {p && canManage ? (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 aria-hidden />{t("deleteProduct")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t("basics")}</CardTitle>
              <Tabs value={lang} onValueChange={(v) => setLang(v as "ar" | "en")}>
                {/* eslint-disable-next-line rtl/no-hardcoded-arabic -- language names are not translated */}
                <TabsList><TabsTrigger value="ar">العربية</TabsTrigger><TabsTrigger value="en">English</TabsTrigger></TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-4">
              {lang === "ar" ? (
                <>
                  <Field label={t("nameAr")} htmlFor="p-name"><Input id="p-name" value={draft.nameAr} onChange={(e) => set("nameAr", e.target.value)} required /></Field>
                  <Field label={t("shortDescription")} htmlFor="p-short"><Input id="p-short" value={draft.shortDescriptionAr} onChange={(e) => set("shortDescriptionAr", e.target.value)} maxLength={200} /></Field>
                </>
              ) : (
                <Field label={t("nameEn")} htmlFor="p-name-en"><Input id="p-name-en" dir="ltr" value={draft.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></Field>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="p-desc">{t(lang === "ar" ? "descriptionAr" : "descriptionEn")}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={aiDescribe}><Sparkles aria-hidden />{t("aiWrite")}</Button>
                </div>
                <Textarea id="p-desc" rows={5} dir={lang === "en" ? "ltr" : "rtl"} value={lang === "ar" ? draft.descriptionAr : draft.descriptionEn} onChange={(e) => set(lang === "ar" ? "descriptionAr" : "descriptionEn", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <MediaCard draft={draft} set={set} drag={drag} setDrag={setDrag} moveMedia={moveMedia} />

          <OptionsVariantsCard draft={draft} set={set} bulk={bulk} setBulk={setBulk} setVariant={setVariant} stockFor={stockFor} isNew={isNew} orderedVariantIds={orderedVariantIds} />

          <SeoCard draft={draft} set={set} />

          <AiNotesCard draft={draft} set={set} />

          {p && !draft.requiresShipping ? <ProductDigitalCard productId={p.id} /> : null}
        </div>

        <div className="space-y-4">
          <OrganizationCard
            draft={draft}
            set={set}
            categories={categories.data ?? []}
            collections={collections.data ?? []}
            toggleId={toggleId}
            tagInput={tagInput}
            setTagInput={setTagInput}
          />

          {p ? <ProductStatsCard p={p} /> : null}

          {p ? <BackInStockCard p={p} /> : null}

          {p ? <ProductRelatedCard p={p} /> : null}
        </div>
      </div>

      {dirty || isNew ? (
        <div className="bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <p className="text-muted-foreground text-sm">{isNew ? t("newHint") : t("unsavedChanges")}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => (isNew ? router.push(recallListUrl("/products")) : setDraft(fromProduct(p as Product)))}>{tc("cancel")}</Button>
              {canManage ? <Button onClick={submit} disabled={save.isPending}><Save aria-hidden />{tc("save")}</Button> : null}
            </div>
          </div>
        </div>
      ) : null}

      {unsavedDialog}
      {p ? <DeleteProductDialog p={p} open={deleteOpen} onOpenChange={setDeleteOpen} /> : null}
    </div>
  );
}
