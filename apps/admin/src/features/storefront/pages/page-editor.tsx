"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActiveTheme, useCreatePage, usePageList, useUpdatePage, type PageInput } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageError } from "@repo/ui/components/page-error";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import Link from "@/components/store-link";
import { useStoreRouter } from "@/lib/store-route";

type ErrKey = "required" | "slug" | "taken";
type Errors = Partial<Record<"title" | "slug", ErrKey>>;

const ERR_MESSAGES = {
  required: "errors.required",
  slug: "errors.slug",
  taken: "errors.taken",
} as const;

export function PageEditor() {
  const t = useTranslations("storefront.pages.editor");
  const mt = useMsgToast();
  const router = useStoreRouter();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const list = usePageList();
  const pageData = isNew ? undefined : list.data?.find((p) => p.id === params.id);
  const create = useCreatePage();
  const update = useUpdatePage();
  const { data: theme } = useActiveTheme();
  const customTemplates = theme?.customTemplates ?? [];
  const pending = create.isPending || update.isPending;

  const [values, setValues] = React.useState<PageInput>({
    title: { ar: "", en: "" },
    slug: "",
    content: { ar: "", en: "" },
    seo: { title: "", description: "" },
    status: "draft",
    showInMenu: false,
    templateId: null,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!isNew && pageData && !loaded) {
      setValues({
        id: pageData.id,
        title: { ar: pageData.title.ar, en: pageData.title.en ?? "" },
        slug: pageData.slug,
        content: { ar: pageData.content.ar, en: pageData.content.en ?? "" },
        seo: { title: pageData.seo.title, description: pageData.seo.description },
        status: pageData.status,
        showInMenu: pageData.showInMenu,
        templateId: pageData.templateId ?? null,
      });
      setLoaded(true);
    }
  }, [isNew, pageData, loaded]);

  const set = (patch: Partial<PageInput>) => setValues((v) => ({ ...v, ...patch }));

  const submit = () => {
    const next: Errors = {};
    if (!values.title.ar.trim()) next.title = "required";
    if (!values.slug.trim()) next.slug = "required";
    else if (!/^[a-z0-9-]+$/.test(values.slug.trim())) next.slug = "slug";
    setErrors(next);
    if (Object.keys(next).length) return;
    const input: PageInput = {
      title: { ar: values.title.ar.trim(), en: values.title.en?.trim() || undefined },
      slug: values.slug.trim(),
      content: { ar: values.content.ar, en: values.content.en || undefined },
      seo: { title: values.seo.title, description: values.seo.description },
      status: values.status,
      showInMenu: values.showInMenu,
      templateId: values.templateId ?? null,
    };
    const onError = (err: Error) => {
      if (err.message === "slug_taken") setErrors({ slug: "taken" });
      else mt.error("common.save.error");
    };
    if (isNew) {
      create.mutate([input], {
        onSuccess: (p) => {
          mt.success("common.save.success");
          router.push(`/storefront/pages/${p.id}`);
        },
        onError,
      });
    } else {
      update.mutate([params.id, input], {
        onSuccess: () => mt.success("common.save.success"),
        onError,
      });
    }
  };

  if (!isNew && list.status === "pending") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (!isNew && (list.status === "error" || !pageData)) {
    return <PageError errorKey="404" onRetry={list.refetch} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? t("newTitle") : t("editTitle")}
        actions={
          <Button variant="outline" asChild>
            <Link href="/storefront/pages">
              <ArrowRight aria-hidden />
              {t("back")}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pg-title-ar">{t("titleAr")} *</Label>
                <Input id="pg-title-ar" value={values.title.ar} onChange={(e) => set({ title: { ...values.title, ar: e.target.value } })} aria-invalid={Boolean(errors.title)} />
                {errors.title ? <p className="text-destructive text-xs">{t(ERR_MESSAGES[errors.title])}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pg-title-en">{t("titleEn")}</Label>
                <Input id="pg-title-en" dir="ltr" value={values.title.en} onChange={(e) => set({ title: { ...values.title, en: e.target.value } })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-slug">{t("slug")} *</Label>
              <Input id="pg-slug" dir="ltr" className="max-w-xs" value={values.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} aria-invalid={Boolean(errors.slug)} />
              {errors.slug ? <p className="text-destructive text-xs">{t(ERR_MESSAGES[errors.slug])}</p> : <p className="text-muted-foreground text-xs">{t("slugHint")}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-content-ar">{t("contentAr")}</Label>
              <Textarea id="pg-content-ar" rows={8} value={values.content.ar} onChange={(e) => set({ content: { ...values.content, ar: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-content-en">{t("contentEn")}</Label>
              <Textarea id="pg-content-en" dir="ltr" rows={5} value={values.content.en} onChange={(e) => set({ content: { ...values.content, en: e.target.value } })} />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("seoTitle")} / {t("seoDescription")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pg-seo-title">{t("seoTitle")}</Label>
                <Input id="pg-seo-title" value={values.seo.title} onChange={(e) => set({ seo: { ...values.seo, title: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pg-seo-desc">{t("seoDescription")}</Label>
                <Textarea id="pg-seo-desc" rows={3} value={values.seo.description} onChange={(e) => set({ seo: { ...values.seo, description: e.target.value } })} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("template")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Select
                  value={values.templateId ?? "none"}
                  onValueChange={(v) => set({ templateId: v === "none" ? null : v })}
                >
                  <SelectTrigger aria-label={t("template")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("templateNone")}</SelectItem>
                    {customTemplates.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.nameAr || ct.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">{t("templateHint")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-5">
              <Label className="flex items-center justify-between gap-3">
                <span className="text-sm font-normal">{t("published")}</span>
                <Switch checked={values.status === "published"} onCheckedChange={(v) => set({ status: v ? "published" : "draft" })} />
              </Label>
              <Label className="flex items-center justify-between gap-3">
                <span className="text-sm font-normal">{t("showInMenu")}</span>
                <Switch checked={values.showInMenu} onCheckedChange={(v) => set({ showInMenu: v })} />
              </Label>
              <Button className="w-full" loading={pending} onClick={submit}>
                {t("save")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
