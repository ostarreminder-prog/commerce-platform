import type { ThemeGlobals } from "@repo/contracts";

/**
 * Canned Arabic copy for the "write it for me" sparkles button — keyed by the
 * field name (`field.key`/`labelKey`), with a generic fallback.
 */
const AR_COPY: Record<string, string> = {
  title: "اكتشف تشكيلتنا الجديدة",
  subtitle: "منتجات مختارة بعناية توصل لباب بيتك",
  announcement: "شحن مجاني للطلبات فوق 200 ريال",
  ctaLabel: "تسوق الآن",
  buttonLabel: "اشترك الآن",
  about: "متجر سعودي يقدم منتجات أصلية بجودة عالية وخدمة توصيل سريعة لكل مناطق المملكة.",
  storeName: "متجر نخلة",
  text: "نحرص على اختيار أفضل المنتجات بجودة تليق بعملائنا، مع توصيل سريع وخدمة عملاء على مدار الساعة.",
  content: "نحرص على اختيار أفضل المنتجات بجودة تليق بعملائنا، مع توصيل سريع وخدمة عملاء على مدار الساعة.",
  body: "نحرص على اختيار أفضل المنتجات بجودة تليق بعملائنا.",
  newsletterTitle: "انضم لقائمتنا البريدية",
  placeholder: "بريدك الإلكتروني",
  quote: "تجربة تسوق رائعة — جودة ممتازة وتوصيل أسرع مما توقعت.",
  q: "كيف أتتبع طلبي؟",
  a: "تصلك رسالة برابط التتبع فور شحن الطلب، وتقدر تتابعه من صفحة طلباتك.",
  copyright: "جميع الحقوق محفوظة",
  label: "اعرض المزيد",
  expiredMessage: "انتهى العرض — تابعنا لعروض جديدة",
};

/** `aiAssist` handler injected into `SectionSettingsForm` — returns canned ar copy per field. */
export const editorAiAssist = (key: string): string =>
  AR_COPY[key] ?? "نص مقترح يوصف منتجك بشكل جذاب وواضح.";

/* ---- "صمم لي بالـ AI" deterministic suggestion generator ---- */

export type AiTone = "luxury" | "modern" | "minimal" | "playful";
export type AiAudience = "general" | "family" | "youth" | "premium";

export interface AiSuggestion {
  id: string;
  tone: AiTone;
  nameAr: string;
  nameEn: string;
  /** Partial globals merged over the draft's. */
  globals: Partial<ThemeGlobals>;
  /** Swatch colors shown on the suggestion card. */
  swatches: string[];
  /** Preferred section-type order for the home template. */
  typeOrder: string[];
}

const BASE_ORDER = ["header", "hero", "categories", "featured-products", "banner", "testimonials", "newsletter", "footer"];

const SUGGESTIONS: AiSuggestion[] = [
  {
    id: "ai-luxury",
    tone: "luxury",
    nameAr: "فخم",
    nameEn: "Luxury",
    globals: { primaryColor: "#14532d", font: "ibm", headingFont: "cairo", radius: 4, spacing: "relaxed" },
    swatches: ["#14532d", "#faf7f0", "#1c1917", "#b45309"],
    typeOrder: ["header", "hero", "featured-products", "image-text", "testimonials", "newsletter", "footer"],
  },
  {
    id: "ai-modern",
    tone: "modern",
    nameAr: "عصري",
    nameEn: "Modern",
    globals: { primaryColor: "#0f766e", font: "tajawal", headingFont: "tajawal", radius: 12, spacing: "normal" },
    swatches: ["#0f766e", "#f8fafc", "#0f172a", "#f59e0b"],
    typeOrder: ["header", "slider", "categories", "featured-products", "tabs", "features", "footer"],
  },
  {
    id: "ai-playful",
    tone: "playful",
    nameAr: "مرح",
    nameEn: "Playful",
    globals: { primaryColor: "#be185d", font: "cairo", headingFont: "cairo", radius: 20, spacing: "relaxed" },
    swatches: ["#be185d", "#fff7ed", "#431407", "#0ea5e9"],
    typeOrder: ["header", "hero", "countdown", "categories", "featured-products", "collage", "newsletter", "footer"],
  },
];

/**
 * Deterministic "AI" output — the three canned looks ordered so the picked
 * tone leads; the selected audience only nudges density.
 */
export function generateSuggestions(tone: AiTone, audience: AiAudience): AiSuggestion[] {
  const sorted = [...SUGGESTIONS].sort((a) => (a.tone === tone ? -1 : 1));
  const spacing = audience === "family" ? "compact" : audience === "premium" ? "relaxed" : undefined;
  return spacing
    ? sorted.map((s) => ({ ...s, globals: { ...s.globals, spacing: spacing as ThemeGlobals["spacing"] } }))
    : sorted;
}

/** Map a preferred section-type order onto the template's existing section ids. */
export const orderSectionIds = (typeOrder: string[], ids: { id: string; type: string }[]): string[] => {
  const rank = (type: string) => {
    const i = typeOrder.indexOf(type);
    return i === -1 ? typeOrder.length : i;
  };
  const remaining = [...ids].sort((a, b) => rank(a.type) - rank(b.type));
  return remaining.map((s) => s.id);
};

export { BASE_ORDER };
