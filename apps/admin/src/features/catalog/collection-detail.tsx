"use client";

import * as React from "react";
import { ExternalLink, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  resolveCollectionProducts, useCategoryList, useCollectionById, useCollectionProducts, useDeleteCollection, useInventoryLevels,
  useProductList, useSaveCollection, type CollectionInput,
} from "@repo/api-client";
import type { Collection, MediaRef } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { MediaField } from "@/components/media-field";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { useUnsavedGuard } from "@/lib/unsaved-guard";
import { recallListUrl } from "@/lib/url-state";
import { MatchedProductsCard } from "@/features/catalog/collection-matched";
import { ManualProductsCard } from "@/features/catalog/collection-products";
import { CollectionRulesCard, type RuleDraft } from "@/features/catalog/collection-rules";

export function CollectionDetail() {
  const t = useTranslations("collections.detail");
  const tList = useTranslations("catalog.collections");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const canManage = useCan("products.manage");
  const collection = useCollectionById(isNew ? "" : params.id);
  const resolved = useCollectionProducts(isNew ? "" : params.id);
  const products = useProductList();
  const levels = useInventoryLevels();
  const categories = useCategoryList();
  const mt = useMsgToast();
  const save = useSaveCollection();
  const del = useDeleteCollection();

  const [nameAr, setNameAr] = React.useState("");
  const [nameEn, setNameEn] = React.useState("");
  const [descriptionAr, setDescriptionAr] = React.useState("");
  const [type, setType] = React.useState<Collection["type"]>("manual");
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [rules, setRules] = React.useState<RuleDraft[]>([{ field: "price", op: "lt", value: "" }]);
  const [match, setMatch] = React.useState<Collection["match"]>("all");
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [image, setImage] = React.useState<MediaRef | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [seeded, setSeeded] = React.useState(false);
  const initialRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const c = collection.data;
    if (!c || seeded) return;
    const seededRules: RuleDraft[] = c.rules.length ? c.rules.map((r) => ({ field: r.field, op: r.op, value: r.value })) : [{ field: "price", op: "lt", value: "" }];
    setNameAr(c.name.ar); setNameEn(c.name.en ?? ""); setDescriptionAr(c.description.ar);
    setType(c.type); setProductIds(c.productIds); setMatch(c.match); setRules(seededRules);
    setSeoTitle(c.seo.title); setSeoDescription(c.seo.description); setImage(c.image);
    initialRef.current = JSON.stringify({ nameAr: c.name.ar, nameEn: c.name.en ?? "", descriptionAr: c.description.ar, type: c.type, productIds: c.productIds, rules: seededRules, match: c.match, seoTitle: c.seo.title, seoDescription: c.seo.description, image: c.image });
    setSeeded(true);
  }, [collection.data, seeded]);

  const dirty = React.useMemo(() => {
    const snap = JSON.stringify({ nameAr, nameEn, descriptionAr, type, productIds, rules, match, seoTitle, seoDescription, image });
    if (initialRef.current !== null) return snap !== initialRef.current;
    return nameAr.trim() !== "" || descriptionAr.trim() !== "" || productIds.length > 0 || image !== null;
  }, [nameAr, nameEn, descriptionAr, type, productIds, rules, match, seoTitle, seoDescription, image]);
  const unsavedDialog = useUnsavedGuard(dirty);

  if (!isNew && collection.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;
  if (!isNew && (collection.isError || !collection.data)) {
    return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/collections"))}>{t("backToList")}</Button>} /></Card>;
  }
  const c = collection.data ?? null;

  const validRules = rules.filter((r) => r.value.trim());
  const preview: Collection = {
    id: c?.id ?? "preview", name: { ar: nameAr }, slug: "", description: { ar: "" }, image: null, seo: { title: "", description: "" },
    type, productIds, rules: validRules as Collection["rules"], match,
  };
  const matched = isNew || type === "automatic" ? resolveCollectionProducts(preview, products.data ?? [], levels.data ?? []) : (resolved.data ?? []);

  const submit = () => {
    if (!nameAr.trim()) { toast.error(t("nameRequired")); return; }
    if (type === "automatic" && !validRules.length) { toast.error(t("rulesRequired")); return; }
    const input: CollectionInput = {
      id: c?.id, name: { ar: nameAr.trim(), en: nameEn.trim() || undefined }, description: { ar: descriptionAr },
      type, productIds, rules: validRules as Collection["rules"], match, image,
      seo: { title: seoTitle || nameAr, description: seoDescription },
    };
    save.mutate([input], {
      onSuccess: (saved) => {
        mt.success("products.saved", { name: saved.name[locale] ?? saved.name.ar });
        initialRef.current = null;
        setSeeded(false);
        router.push(`/collections/${saved.id}`);
      },
      onError: () => toast.error(t("saveFailed")),
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <Breadcrumbs items={[{ label: tList("title"), href: recallListUrl("/collections") }, { label: c ? (c.name[locale] ?? c.name.ar) : t("newCollection") }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{c ? (c.name[locale] ?? c.name.ar) : t("newCollection")}</h1>
          {c ? <StatusBadge entity="collection" field="type" value={c.type} /> : null}
        </div>
        <div className="flex items-center gap-2">
          {c ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`http://localhost:3001/c/${c.slug}`} target="_blank" rel="noreferrer"><ExternalLink aria-hidden />{t("viewInStore")}</a>
            </Button>
          ) : null}
          {c && canManage ? (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 aria-hidden />{tc("delete")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("basics")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="col-name">{t("nameAr")}</Label><Input id="col-name" value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="col-name-en">{t("nameEn")}</Label><Input id="col-name-en" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="col-desc">{t("description")}</Label><Textarea id="col-desc" rows={2} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>{t("fields.image")}</Label>
                <MediaField
                  value={image?.url ?? ""}
                  disabled={!canManage}
                  onChange={(url) =>
                    setImage(url === null ? null : { id: image?.id ?? `col_img_${c?.id ?? "new"}`, url, alt: { ar: nameAr || "·" }, width: 800, height: 800 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("type")}</Label>
                <RadioGroup value={type} onValueChange={(v) => setType(v as Collection["type"])} className="grid gap-2 sm:grid-cols-2">
                  {(["manual", "automatic"] as const).map((k) => (
                    <Label key={k} className={cn("flex cursor-pointer flex-col gap-1 rounded-md border p-3", type === k && "border-primary bg-primary/5")}>
                      <span className="flex items-center gap-2 font-medium"><RadioGroupItem value={k} />{t(`types.${k}`)}</span>
                      <span className="text-muted-foreground text-xs">{t(`typesHint.${k}`)}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {type === "manual" ? (
            <ManualProductsCard productIds={productIds} setProductIds={setProductIds} products={products.data ?? []} />
          ) : (
            <CollectionRulesCard match={match} setMatch={setMatch} rules={rules} setRules={setRules} categories={categories.data ?? []} />
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">{t("seo")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="col-seo-title">{t("seoTitle")}</Label><Input id="col-seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} /></div>
              <div className="space-y-1.5"><Label htmlFor="col-seo-desc">{t("seoDescription")}</Label><Textarea id="col-seo-desc" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={160} /></div>
            </CardContent>
          </Card>
        </div>

        <div>
          <MatchedProductsCard matched={matched} />
        </div>
      </div>

      <div className="bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-muted-foreground text-sm">{dirty ? t("unsavedChanges") : " "}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(recallListUrl("/collections"))}>{tc("cancel")}</Button>
            {canManage ? <Button onClick={submit} disabled={save.isPending}><Save aria-hidden />{tc("save")}</Button> : null}
          </div>
        </div>
      </div>

      {unsavedDialog}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteTitle")}
        body={t("deleteDescription")}
        confirmLabel={t("confirmDelete")}
        danger
        pending={del.isPending}
        onConfirm={() =>
          c && del.mutate([c.id], {
            onSuccess: () => { toast.success(t("deleted")); setDeleteOpen(false); router.push(recallListUrl("/collections")); },
            onError: () => toast.error(t("saveFailed")),
          })
        }
      />
    </div>
  );
}
