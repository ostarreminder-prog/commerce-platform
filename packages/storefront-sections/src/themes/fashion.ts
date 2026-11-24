import type { Theme } from "@repo/contracts";
import { blk, featureBlocks, footerSec, headerSec, mainProductSec, makeTheme, preset, scheme, sec } from "./helpers";

/**
 * أناقة — fashion storefront. IDs reference cat_fashion + prd_012..prd_016.
 */
export const fashionTheme: Theme = makeTheme(
  "theme_fashion",
  "أناقة — أزياء",
  {
    primaryColor: "#9d174d",
    font: "tajawal",
    headingFont: "tajawal",
    spacing: "relaxed",
    radius: 4,
    logoPosition: "center",
    announcementBar: "تشكيلة الموسم الجديدة وصلت — خصم 15% على الأزياء",
  },
  {
    home: [
      headerSec("تشكيلة الموسم الجديدة وصلت — خصم 15% على الأزياء", "New season drop — 15% off fashion", "أناقة", "Anaqa", "centered"),
      sec(
        "hero",
        { layout: "split", productIds: ["prd_012", "prd_015", "prd_016"] },
        [
          blk("heading", { textAr: "أناقة تُشبهك", textEn: "Style that feels like you", size: "lg" }),
          blk("text", { contentAr: "عبايات وأثواب وإكسسوارات مختارة بذوق رفيع.", contentEn: "Abayas, thobes and accessories curated with taste." }),
          blk("button", { labelAr: "تسوّقي الجديد", labelEn: "Shop the new drop", url: "/#cat_fashion", style: "solid" }),
        ],
      ),
      sec("categories", {
        titleAr: "تسوّق حسب التصنيف",
        titleEn: "Shop by category",
        categoryIds: ["cat_fashion", "cat_care", "cat_perfume", "cat_home"],
        columns: "4",
        mobile: { columns: "3" },
      }),
      sec("featured-products", {
        titleAr: "مختارات الأسبوع",
        titleEn: "Picks of the week",
        productIds: ["prd_012", "prd_013", "prd_014", "prd_015", "prd_016"],
        limit: 5,
        showViewAll: true,
      }),
      sec(
        "tabs",
        { titleAr: "تسوّقي حسب المجموعة", titleEn: "Shop by collection" },
        [
          blk("tab", { labelAr: "العبايات", labelEn: "Abayas", productIds: "prd_012,prd_015" }),
          blk("tab", { labelAr: "أثواب وشماغ", labelEn: "Thobes & shemagh", productIds: "prd_013,prd_014" }),
          blk("tab", { labelAr: "إكسسوارات", labelEn: "Accessories", contentAr: "قطع تكمل إطلالتك — حقائب وطرح مختارة.", contentEn: "Pieces that finish your look — curated bags and hijabs.", productIds: "prd_015,prd_016" }),
        ],
      ),
      sec(
        "slider",
        { titleAr: "عروض الأزياء", titleEn: "Fashion offers" },
        [
          blk("slide", { titleAr: "خصم 15% على الأزياء", titleEn: "15% off fashion", textAr: "لفترة محدودة على التشكيلة الجديدة", textEn: "Limited time on the new collection", ctaLabelAr: "تسوّقي الآن", ctaLabelEn: "Shop now", hue: "330" }),
          blk("slide", { titleAr: "العبايات الجديدة", titleEn: "New abayas", textAr: "قصّات عصرية بخامات فاخرة", textEn: "Modern cuts in premium fabrics", ctaLabelAr: "اكتشفيها", ctaLabelEn: "Discover", hue: "280" }),
        ],
      ),
      sec("video", {
        videoUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
        posterHue: 330,
        titleAr: "شاهدي تشكيلة الموسم",
        titleEn: "Watch the season's collection",
        autoplay: false,
        muted: true,
      }),
      sec("image-text", {
        titleAr: "خامات تدوم",
        titleEn: "Fabrics that last",
        textAr: "نختار خاماتنا من أفضل المصادر لتبقى قطعتك المفضلة سنوات.",
        textEn: "We source premium fabrics so your favourite piece lasts for years.",
        ctaLabelAr: "اقرأي قصتنا",
        ctaLabelEn: "Read our story",
        ctaUrl: "/",
        imageHue: 330,
        imageSide: "start",
      }),
      sec("features", { titleAr: "", titleEn: "", columns: "4" }, featureBlocks()),
      sec("newsletter", {
        titleAr: "كوني أول من يعرف",
        titleEn: "Be first to know",
        textAr: "إصدارات محدودة وخصومات خاصة للمشتركات.",
        textEn: "Limited drops and subscriber-only discounts.",
        placeholderAr: "بريدك الإلكتروني",
        placeholderEn: "Your email address",
        buttonLabelAr: "اشتركي",
        buttonLabelEn: "Subscribe",
        colorScheme: "scheme_rose",
      }),
      sec("recently-viewed", { titleAr: "شاهدتي مؤخراً", titleEn: "Recently viewed", limit: 8 }),
      footerSec("أناقة — أزياء سعودية بذوق عالمي.", "Anaqa — Saudi fashion with a global taste."),
    ],
    product: [
      headerSec("تشكيلة الموسم الجديدة وصلت", "New season drop is here", "أناقة", "Anaqa", "centered"),
      mainProductSec(),
      sec("featured-products", {
        titleAr: "يكمّل إطلالتك",
        titleEn: "Complete the look",
        productIds: ["prd_015", "prd_016", "prd_013"],
        limit: 3,
        showViewAll: false,
      }),
      footerSec("أناقة — أزياء سعودية بذوق عالمي.", "Anaqa — Saudi fashion with a global taste."),
    ],
    category: [
      headerSec("تشكيلة الموسم الجديدة وصلت", "New season drop is here", "أناقة", "Anaqa", "centered"),
      sec("categories", { titleAr: "الأقسام", titleEn: "Categories", categoryIds: ["cat_fashion", "cat_care"], columns: "3" }),
      sec("video", {
        videoUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
        posterHue: 330,
        titleAr: "جولة في التشكيلة",
        titleEn: "A tour of the collection",
        autoplay: false,
        muted: true,
      }),
      footerSec("أناقة — أزياء سعودية بذوق عالمي.", "Anaqa — Saudi fashion with a global taste."),
    ],
    cart: [
      headerSec("تشكيلة الموسم الجديدة وصلت", "New season drop is here", "أناقة", "Anaqa", "centered"),
      sec("features", { columns: "4" }, featureBlocks()),
      footerSec("أناقة — أزياء سعودية بذوق عالمي.", "Anaqa — Saudi fashion with a global taste."),
    ],
    page: [
      headerSec("تشكيلة الموسم الجديدة وصلت", "New season drop is here", "أناقة", "Anaqa", "centered"),
      sec("image-text", {
        titleAr: "قصة أناقة",
        titleEn: "The Anaqa story",
        textAr: "أزياء سعودية مختارة بذوق رفيع — من العباية إلى الإكسسوار.",
        textEn: "Saudi fashion curated with taste — from abayas to accessories.",
        ctaLabelAr: "تسوّقي التشكيلة",
        ctaLabelEn: "Shop the collection",
        ctaUrl: "/",
        imageHue: 330,
        imageSide: "start",
      }),
      sec("features", { columns: "4" }, featureBlocks()),
      footerSec("أناقة — أزياء سعودية بذوق عالمي.", "Anaqa — Saudi fashion with a global taste."),
    ],
  },
  null,
  {
    colorSchemes: [
      scheme("scheme_rose", "وردي", "Rose", {
        background: "#fdf2f6",
        text: "#4a1029",
        buttonBg: "#9d174d",
        buttonText: "#ffffff",
        accent: "#fbe0eb",
      }),
      scheme("scheme_noir", "أسود مخملي", "Velvet black", {
        background: "#17101a",
        text: "#f3e9ef",
        buttonBg: "#e8b7d0",
        buttonText: "#2b0a1e",
        accent: "#2a1a2e",
      }),
    ],
    presets: [
      preset("preset_ramadan", "رمضان", "Ramadan", {
        primaryColor: "#1e5631",
        announcementBar: "رمضان كريم — إطلالات العيد وصلت",
      }),
      preset("preset_national", "اليوم الوطني", "National Day", {
        primaryColor: "#166534",
        announcementBar: "تشكيلة اليوم الوطني — اخضرار الفخر",
      }),
    ],
  },
);
