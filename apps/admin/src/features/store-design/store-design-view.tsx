"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useActiveTheme, useCategoryList, useCollectionList, useMenus, usePageList, useProductList } from "@repo/api-client";
import type { Category, Collection, Menu, Page, Product, Theme } from "@repo/contracts";
import { SectionDataProvider } from "@repo/storefront-sections";
import { MediaAdapterProvider, type SectionMediaAdapter } from "@repo/storefront-sections/editor";
import { DataState } from "@repo/ui/components/data-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import type { Locale } from "@repo/ui/lib/format";
import { useMediaLibrary } from "@/lib/media";
import { useUnsavedGuard } from "@/lib/unsaved-guard";
import { EditorPreview } from "./editor-preview";
import { EditorSectionsPanel } from "./editor-sections-panel";
import { EditorSettingsPanel } from "./editor-settings-panel";
import { EditorTopbar } from "./editor-topbar";
import { useEditorState } from "./use-editor-state";

function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <Skeleton className="h-[480px]" />
        <Skeleton className="h-[480px]" />
        <Skeleton className="h-[480px] max-xl:hidden" />
      </div>
    </div>
  );
}

function DesignEditor({
  theme,
  title,
  locale,
  products,
  categories,
  menus,
  pages,
  collections,
}: {
  theme: Theme;
  title: string;
  locale: Locale;
  products: Product[];
  categories: Category[];
  menus: Menu[];
  pages: Page[];
  collections: Collection[];
}) {
  const editor = useEditorState(theme);
  const lib = useMediaLibrary();
  /* Draft edits autosave after ~5s — block navigation while a save is pending
   * or in-flight so the merchant doesn't lose a half-saved design. */
  const unsavedGuard = useUnsavedGuard(editor.saveState === "dirty" || editor.saveState === "saving");
  const mediaAdapter = React.useMemo<SectionMediaAdapter>(
    () => ({ images: lib.images, uploading: lib.uploading, upload: lib.upload }),
    [lib],
  );
  return (
    <SectionDataProvider
      products={products}
      categories={categories}
      menus={menus}
      pages={pages}
      collections={collections}
      locale={locale}
      globals={editor.draft.globals}
      colorSchemes={editor.draft.colorSchemes ?? []}
      device={editor.device}
      previewEntity={editor.previewEntity ?? undefined}
      storeName={editor.draft.name}
    >
      <MediaAdapterProvider adapter={mediaAdapter}>
        <div className="flex flex-col gap-4">
          <EditorTopbar editor={editor} title={title} />
          <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
            <EditorSectionsPanel editor={editor} />
            <EditorPreview editor={editor} />
            <EditorSettingsPanel editor={editor} />
          </div>
          {unsavedGuard}
        </div>
      </MediaAdapterProvider>
    </SectionDataProvider>
  );
}

export function StoreDesignView() {
  const t = useTranslations("storeDesign");
  const { locale } = useAppLocale();
  const theme = useActiveTheme();
  const { data: products = [] } = useProductList();
  const { data: categories = [] } = useCategoryList();
  const { data: menus = [] } = useMenus();
  const { data: pages = [] } = usePageList();
  const { data: collections = [] } = useCollectionList();

  return (
    <DataState state={theme} loading={<EditorSkeleton />}>
      {(loaded) => (
        <DesignEditor
          key={loaded.id}
          theme={loaded}
          title={t("title")}
          locale={locale}
          products={products}
          categories={categories}
          menus={menus}
          pages={pages}
          collections={collections}
        />
      )}
    </DataState>
  );
}
