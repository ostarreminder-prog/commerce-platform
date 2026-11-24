"use client";

import { useTranslations } from "next-intl";
import { useActiveTheme, useCategoryList, useCollectionList, useMenus, usePageList, useProductList } from "@repo/api-client";
import { useStore } from "@/lib/store-product";
import { ThemeTemplateRenderer } from "@repo/storefront-sections";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useStoreFeatures } from "@/lib/features";
import { useRecentlyViewedIds } from "@/lib/recently-viewed";
import { themeCssVars } from "@/lib/theme-css";
import { SectionCommerceBridge } from "@/components/section-commerce";

/** Theme templates embed their own chrome sections; the (site) layout already renders real chrome. */
const CHROME_SECTIONS = new Set(["header", "footer"]);

export function HomeView() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { data: theme, isPending } = useActiveTheme();
  const { data: store } = useStore();
  const { data: products = [] } = useProductList();
  const { data: categories = [] } = useCategoryList();
  const { data: menus = [] } = useMenus();
  const { data: pages = [] } = usePageList();
  const { data: collections = [] } = useCollectionList();
  const features = useStoreFeatures();
  const recentlyViewedIds = useRecentlyViewedIds();

  if (!theme) {
    return isPending ? (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    ) : null;
  }

  const sections = theme.sections.home.filter(
    (section) => !CHROME_SECTIONS.has(section.type) && (section.type !== "recently-viewed" || features.on("recentlyViewed")),
  );

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
            recentlyViewedIds,
            locale,
          }}
        />
      </SectionCommerceBridge>
    </div>
  );
}
