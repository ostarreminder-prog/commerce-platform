import type { ActorRef, ISODate, LocalizedText, MediaRef, Phone, Seo, Slug } from "../common";

/* 4.19 Theme / Page / Menu / Domain */
export type ThemeTemplate = "home" | "product" | "category" | "cart" | "page";

/** Preview/render breakpoints used by per-device visibility and settings overrides. */
export type ThemeDevice = "mobile" | "tablet" | "desktop";

/** Primitive value a theme section setting can hold. */
export type ThemeSettingValue = string | number | boolean | string[];

/**
 * Section settings map. Flat keys hold primitives; the reserved keys
 * `mobile` / `tablet` hold per-device override maps merged over the base
 * values at render time (`settings.mobile.title` overrides `settings.title`).
 */
export type ThemeSectionSettings = Record<string, ThemeSettingValue | Record<string, ThemeSettingValue>>;

export interface ThemeSectionVisibility {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

export interface ThemeSection {
  id: string;
  type: string;
  hidden: boolean;
  /** Per-device visibility — missing flags default to visible. */
  visibility?: Partial<ThemeSectionVisibility>;
  settings: ThemeSectionSettings;
  blocks: { id: string; type: string; settings: Record<string, string> }[];
}

export interface ThemeGlobals {
  primaryColor: string;
  /** Body font token: "default" | "cairo" | "tajawal" | "ibm". */
  font: string;
  /** Heading font token — falls back to `font` when empty. */
  headingFont: string;
  /** Page density — scales section vertical rhythm via `--sec-density`. */
  spacing: "compact" | "normal" | "relaxed";
  radius: number;
  logoPosition: "start" | "center";
  announcementBar: string;
  logo?: string;
}

/** Named token set (hex colors) sections opt into via their `colorScheme` setting. */
export interface ColorScheme {
  id: string;
  nameAr: string;
  nameEn: string;
  background: string;
  text: string;
  buttonBg: string;
  buttonText: string;
  accent: string;
}

/** Saved look — swaps colors/fonts/default media without touching sections. */
export interface ThemePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  globals: Partial<ThemeGlobals>;
  /** Per-scheme color overrides keyed by scheme id. */
  colorSchemeOverrides?: Record<string, Partial<Omit<ColorScheme, "id" | "nameAr" | "nameEn">>>;
}

/**
 * Merchant-defined landing template — its own named section list, edited in the
 * theme editor like any base template and referenced by CMS pages via
 * `Page.templateId`.
 */
export interface ThemeCustomTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  sections: ThemeSection[];
}

/**
 * Version-history entry — `snapshot` is a full Theme clone captured at publish/
 * apply time (nested version snapshots are stripped to keep it bounded). Older
 * entries may lack a snapshot; the editor then can't preview/restore them.
 */
export interface ThemeVersion {
  id: string;
  at: ISODate;
  actor: ActorRef;
  note: string;
  snapshot?: Theme;
}

/** Share-link token — opens a theme draft on `/preview?share=<token>` without login. */
export interface ThemeShare {
  id: string;
  token: string;
  /** Draft theme the link resolves to. */
  themeId: string;
  createdAt: ISODate;
  expiresAt: ISODate;
}

/**
 * Storefront feature ids (§بند 8 — مميزات المتجر). Each maps to a switch in the
 * theme editor's "مميزات المتجر" card; `Theme.features[key] === false` disables
 * it, anything else counts as enabled.
 */
export const THEME_FEATURES = [
  "wishlist",
  "compare",
  "reviews",
  "quickView",
  "quickFilters",
  "recentlyViewed",
  "stickyBuyBar",
  "scarcity",
  "viewersNow",
  "deliveryEstimate",
  "sizeGuide",
  "backInStock",
  "installments",
  "share",
  "backToTop",
] as const;
export type ThemeFeature = (typeof THEME_FEATURES)[number];

/** Feature settings that aren't plain on/off toggles. */
export interface ThemeFeatureSettings {
  /** Scarcity badge shows when 0 < stock <= this value. */
  scarcityThreshold?: number;
}

/**
 * Full-page commerce experience ids — duplicated from the storefront-sections
 * experience registry (contracts can't depend on that package). `"classic"`
 * is the built-in hardcoded layout; anything else is a registry experience id
 * the PDP/PLP adapts into a full-page variant.
 */
export type PageExperienceId =
  | "classic"
  | "adaptive-grid"
  | "editorial-showcase"
  | "visual-discovery"
  | "immersive-product"
  | "contextual-shopping"
  | "comparison";

/** Base templates that support a full-page experience (PDP / PLP). */
export type PageExperienceTemplate = "product" | "category";

export interface Theme {
  id: string;
  name: string;
  sections: Record<ThemeTemplate, ThemeSection[]>;
  globals: ThemeGlobals;
  /** Storefront feature toggles (ThemeFeature) — missing keys default to enabled. */
  features?: Record<string, boolean>;
  /** Numeric/extra feature settings (e.g. scarcity threshold). */
  featureSettings?: ThemeFeatureSettings;
  /** Color systems sections can pick via their `colorScheme` setting. */
  colorSchemes?: ColorScheme[];
  /** Preset looks (default, ramadan, national-day…) — colors/fonts/media only. */
  presets?: ThemePreset[];
  /** Landing-page templates owned by this theme. */
  customTemplates?: ThemeCustomTemplate[];
  /**
   * Full-page experience per real route (PDP / PLP) — picked in the theme
   * editor next to the template switcher. Missing/`"classic"` renders the
   * built-in layout; the templates' theme sections keep previewing in the
   * editor independently.
   */
  pageExperiences?: Partial<Record<PageExperienceTemplate, PageExperienceId>>;
  /** Publish date/time set ahead of time — the mock backend publishes on read once it passes. */
  scheduledPublish?: { at: ISODate } | null;
  /** Temporary activation window — the theme goes live inside it and reverts when it ends. */
  activeWindow?: { from: ISODate; to: ISODate } | null;
  status: "draft" | "published";
  versions: ThemeVersion[];
  publishedAt: ISODate | null;
}

export interface Page {
  id: string;
  title: LocalizedText;
  slug: Slug;
  content: LocalizedText;
  seo: Seo;
  status: "draft" | "published";
  showInMenu: boolean;
  /** Custom theme template (`Theme.customTemplates[].id`) rendered instead of plain content. */
  templateId?: string | null;
}

export interface MenuItem {
  id: string;
  label: LocalizedText;
  linkType: "page" | "category" | "collection" | "product" | "url";
  targetId: string | null;
  url: string | null;
  children: MenuItem[];
}

export interface Menu {
  id: string;
  location: "header" | "footer";
  items: MenuItem[];
}

export interface Domain {
  id: string;
  hostname: string;
  type: "subdomain" | "custom";
  verificationStatus: "pending" | "verified" | "failed";
  sslStatus: "pending" | "active" | "failed";
  dnsRecords: { type: "A" | "CNAME" | "TXT"; name: string; value: string }[];
  isPrimary: boolean;
}

export interface SeoRedirect {
  id: string;
  from: string;
  to: string;
  createdAt: ISODate;
}

export interface StorefrontSeo {
  title: string;
  description: string;
  shareImage: MediaRef | null;
}

/* 4.19b Back-in-stock */
/** Storefront visitor asking to be notified when an out-of-stock product returns. */
export interface BackInStockSubscription {
  id: string;
  productId: string;
  phone: Phone;
  createdAt: ISODate;
  /** Set once the merchant/system notifies the visitor — null means still waiting. */
  notifiedAt: ISODate | null;
}

/* 4.19c Reviews (spec بند 8.3)
 * Storefront review — visible on the PDP only when `status === "approved"`;
 * `pending` waits in the merchant queue and `hidden` is merchant-suppressed. */
export type ReviewStatus = "pending" | "approved" | "hidden";

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  /** 1–5 stars. */
  rating: number;
  text: string;
  /** Image urls (dataURL/`placeholder:` fixtures) attached to the review — max 5. */
  images?: string[];
  /** True when the customer received the product in a delivered order. */
  verifiedPurchase: boolean;
  status: ReviewStatus;
  /** Merchant's public reply rendered under the review. */
  merchantReply?: { text: string; at: ISODate };
  createdAt: ISODate;
}
