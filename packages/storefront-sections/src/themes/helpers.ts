import { THEME_FEATURES, type ColorScheme, type Theme, type ThemePreset, type ThemeSection, type ThemeTemplate } from "@repo/contracts";

let seq = 0;
const nextId = (p: string) => `${p}_${(seq++).toString(36).padStart(4, "0")}`;

/** Build a section record — theme files are data fixtures, IDs are deterministic-ish. */
export const sec = (type: string, settings: ThemeSection["settings"] = {}, blocks: ThemeSection["blocks"] = []): ThemeSection => ({
  id: nextId(`sec_${type}`),
  type,
  hidden: false,
  settings,
  blocks,
});

export const blk = (type: string, settings: Record<string, string> = {}): ThemeSection["blocks"][number] => ({
  id: nextId(`blk_${type}`),
  type,
  settings,
});

/** Named color scheme fixture. */
export const scheme = (
  id: string,
  nameAr: string,
  nameEn: string,
  colors: Pick<ColorScheme, "background" | "text" | "buttonBg" | "buttonText" | "accent">,
): ColorScheme => ({ id, nameAr, nameEn, ...colors });

/** Theme preset fixture — colors/fonts/default media only. */
export const preset = (
  id: string,
  nameAr: string,
  nameEn: string,
  globals: ThemePreset["globals"],
  colorSchemeOverrides?: ThemePreset["colorSchemeOverrides"],
): ThemePreset => ({ id, nameAr, nameEn, globals, colorSchemeOverrides });

/** Storefront features (spec §8) ship enabled on all themes — the merchant can switch each off in globals. */
const FEATURE_DEFAULTS: Theme["features"] = Object.fromEntries(THEME_FEATURES.map((k) => [k, true]));

export const makeTheme = (
  id: string,
  name: string,
  globals: Theme["globals"],
  sections: Record<ThemeTemplate, ThemeSection[]>,
  publishedAt: string | null,
  extras: { colorSchemes: ColorScheme[]; presets: ThemePreset[] },
): Theme => ({
  id,
  name,
  sections,
  globals,
  features: { ...FEATURE_DEFAULTS },
  featureSettings: { scarcityThreshold: 5 },
  /* Explicit classic defaults — the PDP/PLP keep their built-in layouts until
   * the merchant picks a full-page experience in the editor. */
  pageExperiences: { product: "classic", category: "classic" },
  status: publishedAt ? "published" : "draft",
  versions: [],
  publishedAt,
  ...extras,
});

/** Default product-page main section — context product + block-driven content. */
export const mainProductSec = () =>
  sec("main-product", { gallerySide: "start" }, [
    blk("title"),
    blk("price", { showCompare: "true" }),
    blk("variant-picker"),
    blk("quantity"),
    blk("buy-button", { showBuyNow: "true" }),
    blk("description", { source: "long" }),
    blk("accordion", {
      titleAr: "الشحن والإرجاع",
      titleEn: "Shipping & returns",
      contentAr: "توصيل خلال 1-4 أيام وإرجاع مجاني خلال 7 أيام.",
      contentEn: "Delivery within 1-4 days and free returns within 7 days.",
    }),
  ]);

/** Shared blocks reused across themes. */
export const featureBlocks = () => [
  blk("feature", { icon: "truck", titleAr: "شحن سريع", titleEn: "Fast shipping", textAr: "توصيل خلال 1-4 أيام لكل مدن المملكة.", textEn: "Delivery within 1-4 days across the Kingdom." }),
  blk("feature", { icon: "shield", titleAr: "دفع آمن", titleEn: "Secure payment", textAr: "مدى وفيزا وآبل باي — بياناتك محمية.", textEn: "mada, Visa and Apple Pay — your data is safe." }),
  blk("feature", { icon: "refresh", titleAr: "إرجاع سهل", titleEn: "Easy returns", textAr: "استرجاع مجاني خلال 7 أيام.", textEn: "Free returns within 7 days." }),
  blk("feature", { icon: "chat", titleAr: "دعم على مدار الساعة", titleEn: "24/7 support", textAr: "فريقنا جاهز يخدمك في أي وقت.", textEn: "Our team is always here for you." }),
];

export const footerSec = (aboutAr: string, aboutEn: string) =>
  sec(
    "footer",
    {
      aboutAr,
      aboutEn,
      columns: "3",
      showNewsletter: true,
      newsletterTitleAr: "النشرة البريدية",
      newsletterTitleEn: "Newsletter",
      placeholderAr: "بريدك الإلكتروني",
      placeholderEn: "Your email address",
      buttonLabelAr: "اشترك",
      buttonLabelEn: "Subscribe",
      showSocial: true,
      copyrightAr: "جميع الحقوق محفوظة",
      copyrightEn: "All rights reserved",
    },
    [
      blk("social-link", { platform: "instagram", url: "https://instagram.com/store" }),
      blk("social-link", { platform: "x", url: "https://x.com/store" }),
    ],
  );

export const headerSec = (announcementAr: string, announcementEn: string, storeNameAr = "", storeNameEn = "", headerVariant = "default") =>
  sec("header", {
    storeNameAr,
    storeNameEn,
    showAnnouncement: true,
    announcementAr,
    announcementEn,
    headerVariant,
    showSearch: true,
    showCart: true,
    showAccount: true,
    showNav: true,
    sticky: true,
  });
