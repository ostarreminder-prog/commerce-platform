"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link2Off } from "lucide-react";
import { useActiveTheme, useCategoryList, useCollectionList, useMenus, usePageList, useProductList, useResolveThemeShare, useThemes } from "@repo/api-client";
import { useStore } from "@/lib/store-product";
import type { Theme, ThemeDevice, ThemeSection } from "@repo/contracts";
import { SectionDataProvider, SectionRenderer, isPageExperience, type PreviewEntity, type PreviewPersona } from "@repo/storefront-sections";
import { Banner } from "@repo/ui/components/banner";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { themeCssVars } from "@/lib/theme-css";
import { SectionCommerceBridge } from "@/components/section-commerce";

/** Sections for a base template key or a `customTemplates` id. */
const templateSections = (theme: Theme, template: string): ThemeSection[] =>
  (theme.sections as Record<string, ThemeSection[]>)[template] ??
  theme.customTemplates?.find((c) => c.id === template)?.sections ??
  [];
const DEVICES: ThemeDevice[] = ["mobile", "tablet", "desktop"];
/** How long an embedded preview waits for the parent's theme before falling back to the active one. */
const FALLBACK_DELAY_MS = 1_000;
/** Origin of the admin app — the only sender the embedded preview trusts. */
const ADMIN_ORIGIN = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3000";

/** postMessage payloads must come from the editor origin (admin) — in an
 * iframe we also accept whatever origin embedded us (document.referrer). */
const isTrustedSender = (event: MessageEvent): boolean => {
  if (event.origin === ADMIN_ORIGIN) return true;
  try {
    return Boolean(document.referrer) && event.origin === new URL(document.referrer).origin;
  } catch {
    return false;
  }
};

/** Minimal shape check so a malformed `theme:update` can't crash the renderer. */
const isTheme = (v: unknown): v is Theme =>
  Boolean(v) && typeof v === "object" && typeof (v as Theme).id === "string" && typeof (v as Theme).sections === "object";

interface PreviewInbound {
  type?: string;
  theme?: Theme;
  /** Base template key or custom template id the editor is working on. */
  template?: string;
  sectionId?: string;
  device?: ThemeDevice;
  previewEntity?: PreviewEntity | null;
  previewPersona?: PreviewPersona;
  entity?: PreviewEntity | null;
  value?: PreviewPersona;
}

function PreviewSkeleton() {
  return (
    <div className="container space-y-4 py-10">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export function PreviewView() {
  const params = useSearchParams();
  const t = useTranslations("store");
  const msgT = useMsg() as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const [postedTheme, setPostedTheme] = useState<Theme | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [postedDevice, setPostedDevice] = useState<ThemeDevice | null>(null);
  const [postedTemplate, setPostedTemplate] = useState<string | null>(null);
  const [postedEntity, setPostedEntity] = useState<PreviewEntity | null>(null);
  const [persona, setPersona] = useState<PreviewPersona>("guest");
  const [allowFallback, setAllowFallback] = useState(false);
  const shareToken = params.get("share");
  const shareQuery = useResolveThemeShare(shareToken);
  const { data: activeTheme } = useActiveTheme();
  /* `?theme=<id>` — direct preview of any theme (themes screen "preview" button). */
  const themeId = params.get("theme");
  const { data: themeList = [] } = useThemes();
  const paramTheme = themeId ? themeList.find((x) => x.id === themeId) : undefined;
  const { data: store } = useStore();
  const { data: products = [] } = useProductList();
  const { data: categories = [] } = useCategoryList();
  const { data: menus = [] } = useMenus();
  const { data: pages = [] } = usePageList();
  const { data: collections = [] } = useCollectionList();

  useEffect(() => {
    const inIframe = window.parent !== window;
    if (inIframe) {
      window.parent.postMessage({ type: "preview:ready" }, ADMIN_ORIGIN);
    } else {
      setAllowFallback(true);
    }
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedSender(event)) return;
      const data = event.data as PreviewInbound | undefined;
      if (data?.type === "theme:update" && isTheme(data.theme)) {
        setPostedTheme(data.theme);
        if (data.device && DEVICES.includes(data.device)) setPostedDevice(data.device);
        if (data.template) setPostedTemplate(data.template);
        if (data.previewEntity !== undefined) setPostedEntity(data.previewEntity);
        if (data.previewPersona) setPersona(data.previewPersona);
      } else if (data?.type === "section:select" && (typeof data.sectionId === "string" || data.sectionId === null)) {
        setSelectedId(data.sectionId);
      } else if (data?.type === "device:update" && data.device && DEVICES.includes(data.device)) {
        setPostedDevice(data.device);
      } else if (data?.type === "entity:select") {
        setPostedEntity(data.entity ?? null);
      } else if (data?.type === "persona" && data.value) {
        setPersona(data.value);
      }
    };
    window.addEventListener("message", onMessage);
    const timer = inIframe ? window.setTimeout(() => setAllowFallback(true), FALLBACK_DELAY_MS) : undefined;
    return () => {
      window.removeEventListener("message", onMessage);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const reportSectionClick = (sectionId: string) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "section:click", sectionId }, ADMIN_ORIGIN);
    }
  };

  const template = postedTemplate ?? params.get("template") ?? "home";
  const requestedDevice = params.get("device") as ThemeDevice | null;
  const device: ThemeDevice | undefined = postedDevice ?? (requestedDevice && DEVICES.includes(requestedDevice) ? requestedDevice : undefined);
  const requestedProduct = params.get("product");
  const previewEntity: PreviewEntity | undefined = postedEntity ?? (requestedProduct ? { type: "product", id: requestedProduct } : undefined);

  /* Share link resolves a draft token; it wins over the active-theme fallback.
   * `?theme=<id>` sits between posted theme and the share/active fallbacks. */
  const sharedTheme = shareToken ? shareQuery.data : null;
  const theme = postedTheme ?? sharedTheme ?? paramTheme ?? (allowFallback || !shareToken ? activeTheme : null);
  const themeSections = theme ? templateSections(theme, template) : [];
  /* Page-experience hint — product/category templates also carry a full-page
   * experience that only the real PDP/PLP render; when such a template has no
   * sections of its own, surface a chip so the editor preview isn't blank. */
  const pageExp = (template === "product" || template === "category") ? theme?.pageExperiences?.[template] : undefined;
  const showExpHint = Boolean(
    (template === "product" || template === "category") &&
      isPageExperience(template, pageExp) &&
      pageExp !== "classic" &&
      themeSections.length === 0,
  );

  if (shareToken && shareQuery.isError) {
    return (
      <div className="container py-20">
        <EmptyState
          icon={Link2Off}
          title={t("preview.shareExpiredTitle")}
          description={t("preview.shareExpiredBody")}
        />
      </div>
    );
  }
  if (!theme) {
    return shareToken && shareQuery.isPending ? <PreviewSkeleton /> : <PreviewSkeleton />;
  }

  return (
    <SectionDataProvider
      products={products}
      categories={categories}
      menus={menus}
      pages={pages}
      collections={collections}
      storeName={store?.name[locale] ?? t("name")}
      globals={theme.globals}
      colorSchemes={theme.colorSchemes ?? []}
      device={device}
      previewEntity={previewEntity}
      previewPersona={persona}
      locale={locale}
    >
      <SectionCommerceBridge>
        <div className="bg-background sec-scope min-h-dvh" style={themeCssVars(theme.globals)}>
        {shareToken ? <Banner variant="warning" title={t("preview.shareBanner")} /> : null}
        {showExpHint ? (
          <div className="container py-6">
            <span className="bg-accent text-accent-foreground inline-block rounded-full px-4 py-2 text-sm font-medium">
              {t("preview.pageExperienceHint", { experience: msgT(`experience.${pageExp}`) })}
            </span>
          </div>
        ) : null}
        {themeSections
          .filter((section) => !section.hidden)
          .map((section) => (
            <div
              key={section.id}
              data-section-id={section.id}
              role="button"
              tabIndex={0}
              aria-label={section.type}
              // Keep section links/buttons inert — the iframe only reports clicks.
              onClickCapture={(e) => e.preventDefault()}
              onClick={() => reportSectionClick(section.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  reportSectionClick(section.id);
                }
              }}
              className={cn(
                "group relative cursor-pointer",
                "hover:outline-primary hover:outline hover:outline-2 hover:outline-offset-2",
                selectedId === section.id && "outline-primary outline outline-2 outline-offset-2",
              )}
            >
              <span
                aria-hidden
                className="bg-primary text-primary-foreground absolute end-2 top-2 z-10 hidden rounded px-1.5 py-0.5 text-[11px] font-medium group-hover:block"
              >
                {msgT(`sectionType.${section.type}`)}
              </span>
              <SectionRenderer section={section} />
            </div>
          ))}
        </div>
      </SectionCommerceBridge>
    </SectionDataProvider>
  );
}
