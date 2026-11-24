"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, FileX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActiveTheme, useCategoryList, useCollectionList, useMenus, usePageList, useProductList } from "@repo/api-client";
import { useStore } from "@/lib/store-product";
import { ThemeTemplateRenderer } from "@repo/storefront-sections";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { themeCssVars } from "@/lib/theme-css";
import { SectionCommerceBridge } from "@/components/section-commerce";

/** Landing templates embed their own chrome sections; the (site) layout already renders real chrome. */
const CHROME_SECTIONS = new Set(["header", "footer"]);

function CmsSkeleton() {
  return (
    <div className="container max-w-2xl space-y-4 py-10">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function CmsView({ slug }: { slug: string }) {
  const t = useTranslations("store");
  const { locale, dir } = useAppLocale();
  const { data: pages = [], isPending } = usePageList();
  const { data: theme } = useActiveTheme();
  const { data: store } = useStore();
  const { data: products = [] } = useProductList();
  const { data: categories = [] } = useCategoryList();
  const { data: menus = [] } = useMenus();
  const { data: collections = [] } = useCollectionList();
  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;

  if (isPending) return <CmsSkeleton />;

  const page = pages.find((p) => p.slug === slug && p.status === "published");
  if (!page)
    return (
      <div className="container py-16">
        <EmptyState
          icon={FileX}
          title={t("cms.notFoundTitle")}
          description={t("cms.notFoundText")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("backHome")}</Link>
            </Button>
          }
        />
      </div>
    );

  /* A page bound to a custom template renders its sections instead of plain content. */
  const template = page.templateId ? theme?.customTemplates?.find((c) => c.id === page.templateId) : undefined;
  if (template && theme) {
    const sections = template.sections.filter((s) => !CHROME_SECTIONS.has(s.type));
    return (
      <div className="sec-scope" style={themeCssVars(theme.globals)}>
        <SectionCommerceBridge>
          <ThemeTemplateRenderer
            sections={sections}
            data={{
              products,
              categories,
              menus,
              pages,
              collections,
              storeName: store?.name[locale] ?? t("name"),
              globals: theme.globals,
              colorSchemes: theme.colorSchemes ?? [],
              previewEntity: { type: "page", id: page.id },
              locale,
            }}
          />
        </SectionCommerceBridge>
      </div>
    );
  }

  const paragraphs = (page.content[locale] ?? "").split(/\n{2,}/).filter((p) => p.trim());
  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1 text-sm">
        <Link href="/" className="hover:text-foreground">
          {t("home")}
        </Link>
        <Sep className="size-4" aria-hidden />
        <span className="text-foreground truncate">{page.title[locale]}</span>
      </nav>
      <h1 className="text-2xl font-bold sm:text-3xl">{page.title[locale]}</h1>
      <div className="space-y-4">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
