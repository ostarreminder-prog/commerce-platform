import type { Theme } from "@repo/contracts";
import { blk, featureBlocks, footerSec, headerSec, mainProductSec, makeTheme, preset, scheme, sec } from "./helpers";

/**
 * دار العود — perfume/oud storefront (the default published theme).
 * IDs reference the real mock catalog: cat_perfume + prd_007..prd_011 and friends.
 */
export const perfumeTheme: Theme = makeTheme(
  "theme_perfume",
  "دار العود — عطور",
  {
    primaryColor: "#6b3f15",
    font: "cairo",
    headingFont: "cairo",
    spacing: "normal",
    radius: 12,
    logoPosition: "start",
    announcementBar: "شحن مجاني للطلبات فوق 200 ر.س · تغليف هدايا مجاني",
  },
  {
    home: [
      headerSec("شحن مجاني للطلبات فوق 200 ر.س · تغليف هدايا مجاني", "Free shipping over SAR 200 · Free gift wrap", "دار العود", "Dar Al Oud"),
      sec(
        "hero",
        { layout: "split", productIds: ["prd_007", "prd_011", "prd_009"] },
        [
          blk("badge", { labelAr: "تشكيلة العود الملكية", labelEn: "The royal oud collection" }),
          blk("heading", { textAr: "عطور تروي حكاية الشرق", textEn: "Perfumes that tell an Eastern story", size: "lg" }),
          blk("text", { contentAr: "دهن عود كمبودي، بخور فاخر، ومسك طهارة — مختارات أصيلة لبيتك ومناسباتك.", contentEn: "Cambodian oud, luxury bakhoor and white musk — authentic picks for your home and occasions." }),
          blk("button", { labelAr: "تسوّق العطور", labelEn: "Shop perfumes", url: "/#cat_perfume", style: "solid" }),
        ],
      ),
      sec("categories", {
        titleAr: "أقسام المتجر",
        titleEn: "Shop by category",
        categoryIds: ["cat_perfume", "cat_home", "cat_care", "cat_coffee"],
        columns: "4",
        mobile: { columns: "3" },
      }),
      sec("collage", { titleAr: "مختارات التحرير", titleEn: "Editor's picks" }, [
        blk("image", { hue: "30" }),
        blk("promo-card", {
          titleAr: "باقة الهدايا",
          titleEn: "The gift set",
          textAr: "عود وبخور وتغليف فاخر — جاهزة للإهداء.",
          textEn: "Oud, bakhoor and luxury wrap — ready to gift.",
          ctaLabelAr: "اكتشفها",
          ctaLabelEn: "Discover it",
          url: "/",
          hue: "20",
        }),
        blk("product-card", { productId: "prd_007" }),
        blk("product-card", { productId: "prd_011" }),
      ]),
      sec("featured-products", {
        titleAr: "الأكثر مبيعاً",
        titleEn: "Best sellers",
        subtitleAr: "مختارات يعشقها عملاؤنا",
        subtitleEn: "Picks our customers love",
        productIds: ["prd_007", "prd_011", "prd_008", "prd_009", "prd_010", "prd_020", "prd_021", "prd_002"],
        limit: 8,
        showViewAll: true,
      }),
      sec(
        "slider",
        { titleAr: "عروض دار العود", titleEn: "Dar Al Oud offers" },
        [
          blk("slide", { titleAr: "اشترِ عطرين وخذ الثالث مجاناً", titleEn: "Buy 2 perfumes, get 1 free", textAr: "على كل تشكيلة العطور", textEn: "On the entire perfume collection", ctaLabelAr: "تسوّق العرض", ctaLabelEn: "Shop the offer", hue: "20" }),
          blk("slide", { titleAr: "دهن العود الكمبودي", titleEn: "Cambodian oud oil", textAr: "نقاء يدوم طوال اليوم", textEn: "Purity that lasts all day", ctaLabelAr: "اكتشفه", ctaLabelEn: "Discover it", hue: "35" }),
          blk("slide", { titleAr: "هدايا رمضان", titleEn: "Ramadan gifts", textAr: "تغليف مجاني مع كل هدية", textEn: "Free wrap with every gift", ctaLabelAr: "اختر هديتك", ctaLabelEn: "Pick your gift", hue: "300" }),
        ],
      ),
      sec("countdown", {
        titleAr: "عرض نهاية الأسبوع ينتهي خلال",
        titleEn: "Weekend offer ends in",
        targetDate: "2026-12-31T21:00:00.000Z",
        expiredAr: "انتهى العرض — ترقّبوا عروضنا القادمة.",
        expiredEn: "Offer ended — stay tuned for what's next.",
        ctaLabelAr: "تسوّق العرض",
        ctaLabelEn: "Shop the offer",
        ctaUrl: "/#cat_perfume",
      }),
      sec("banner", {
        titleAr: "عرض نهاية الأسبوع",
        titleEn: "Weekend offer",
        textAr: "خصم 25% على البخور والمباخر حتى نهاية الشهر.",
        textEn: "25% off bakhoor and burners until end of month.",
        ctaLabelAr: "اغتنم العرض",
        ctaLabelEn: "Grab the deal",
        ctaUrl: "/#cat_perfume",
        colorScheme: "scheme_oud_dark",
      }),
      sec(
        "testimonials",
        { titleAr: "ماذا يقول عملاؤنا", titleEn: "What our customers say" },
        [
          blk("testimonial", { name: "أبو فهد", roleAr: "عميل من الرياض", roleEn: "Customer from Riyadh", quoteAr: "دهن العود الكمبودي ثباته مذهل — أفضل عود جربته.", quoteEn: "The Cambodian oud lasts incredibly — the best I've tried.", rating: "5" }),
          blk("testimonial", { name: "الجوهرة", roleAr: "عميلة من جدة", roleEn: "Customer from Jeddah", quoteAr: "البخور الفاخر صار أساسي في مجلسنا، والتغليف يليق بالهدايا.", quoteEn: "The luxury bakhoor is a staple in our gatherings — gift-worthy packaging.", rating: "5" }),
          blk("testimonial", { name: "محمد", roleAr: "عميل من الدمام", roleEn: "Customer from Dammam", quoteAr: "طلبت عطر الورد الطائفي هدية لوالدتي ووصل بتغليف راقٍ.", quoteEn: "Ordered the Taif rose as a gift for my mother — arrived beautifully wrapped.", rating: "4" }),
        ],
      ),
      sec("features", { titleAr: "", titleEn: "", columns: "4" }, featureBlocks()),
      sec(
        "logo-list",
        { titleAr: "مصادرنا المختارة", titleEn: "Our trusted sources", marquee: true, grayscale: true },
        [
          blk("logo", { name: "عود كمبودي", hue: "20" }),
          blk("logo", { name: "ورد طائفي", hue: "340" }),
          blk("logo", { name: "مسك طهارة", hue: "200" }),
          blk("logo", { name: "بخور ملكي", hue: "45" }),
          blk("logo", { name: "عنبر", hue: "160" }),
        ],
      ),
      sec("newsletter", {
        titleAr: "انضم لقائمة دار العود",
        titleEn: "Join the Dar Al Oud list",
        textAr: "عروض حصرية وإصدارات محدودة قبل الجميع.",
        textEn: "Exclusive offers and limited releases before everyone.",
        placeholderAr: "بريدك الإلكتروني",
        placeholderEn: "Your email address",
        buttonLabelAr: "اشترك",
        buttonLabelEn: "Subscribe",
      }),
      sec("recently-viewed", { titleAr: "شاهدت مؤخراً", titleEn: "Recently viewed", limit: 8 }),
      footerSec("دار العود — عطور وبخور أصيلة من قلب المملكة.", "Dar Al Oud — authentic perfumes and bakhoor from the heart of the Kingdom."),
    ],
    product: [
      headerSec("شحن مجاني للطلبات فوق 200 ر.س", "Free shipping over SAR 200", "دار العود", "Dar Al Oud"),
      mainProductSec(),
      sec("featured-products", {
        titleAr: "قد يعجبك أيضاً",
        titleEn: "You may also like",
        productIds: ["prd_008", "prd_010", "prd_021", "prd_001"],
        limit: 4,
        showViewAll: false,
      }),
      footerSec("دار العود — عطور وبخور أصيلة من قلب المملكة.", "Dar Al Oud — authentic perfumes and bakhoor from the heart of the Kingdom."),
    ],
    category: [
      headerSec("شحن مجاني للطلبات فوق 200 ر.س", "Free shipping over SAR 200", "دار العود", "Dar Al Oud"),
      sec("categories", { titleAr: "تصفح الأقسام", titleEn: "Browse categories", categoryIds: ["cat_perfume", "cat_home", "cat_care"], columns: "3" }),
      sec("banner", {
        titleAr: "تشكيلة العطور كاملة",
        titleEn: "The full perfume collection",
        textAr: "من دهن العود إلى المسك — كل ما تحتاجه في مكان واحد.",
        textEn: "From oud oil to musk — everything in one place.",
        ctaLabelAr: "تسوّق الآن",
        ctaLabelEn: "Shop now",
        ctaUrl: "/",
      }),
      footerSec("دار العود — عطور وبخور أصيلة من قلب المملكة.", "Dar Al Oud — authentic perfumes and bakhoor from the heart of the Kingdom."),
    ],
    cart: [
      headerSec("شحن مجاني للطلبات فوق 200 ر.س", "Free shipping over SAR 200", "دار العود", "Dar Al Oud"),
      sec("features", { columns: "4" }, featureBlocks()),
      footerSec("دار العود — عطور وبخور أصيلة من قلب المملكة.", "Dar Al Oud — authentic perfumes and bakhoor from the heart of the Kingdom."),
    ],
    page: [
      headerSec("شحن مجاني للطلبات فوق 200 ر.س", "Free shipping over SAR 200", "دار العود", "Dar Al Oud"),
      sec("image-text", {
        titleAr: "قصة دار العود",
        titleEn: "The Dar Al Oud story",
        textAr: "من قلب المملكة نجمع أجود أنواع العود والبخور لنصلها لبيتك.",
        textEn: "From the heart of the Kingdom we gather the finest oud and bakhoor for your home.",
        ctaLabelAr: "تسوّق تشكيلتنا",
        ctaLabelEn: "Shop the collection",
        ctaUrl: "/",
        imageHue: 30,
        imageSide: "end",
      }),
      sec("features", { columns: "4" }, featureBlocks()),
      footerSec("دار العود — عطور وبخور أصيلة من قلب المملكة.", "Dar Al Oud — authentic perfumes and bakhoor from the heart of the Kingdom."),
    ],
  },
  "2026-01-15T09:00:00.000Z",
  {
    colorSchemes: [
      scheme("scheme_oud_dark", "ليل العود", "Oud night", {
        background: "#2b1a0e",
        text: "#f5ead9",
        buttonBg: "#d4a24e",
        buttonText: "#2b1a0e",
        accent: "#3d2817",
      }),
      scheme("scheme_sand", "رمال", "Sand", {
        background: "#f7efe3",
        text: "#3a2a18",
        buttonBg: "#6b3f15",
        buttonText: "#ffffff",
        accent: "#ede0cb",
      }),
      scheme("scheme_musk", "مسك", "Musk", {
        background: "#fdfbf7",
        text: "#22201c",
        buttonBg: "#1f1b16",
        buttonText: "#f5ead9",
        accent: "#f0e9dd",
      }),
    ],
    presets: [
      preset("preset_ramadan", "رمضان", "Ramadan", {
        primaryColor: "#1e5631",
        headingFont: "cairo",
        announcementBar: "رمضان كريم — تغليف هدايا مجاني مع كل طلب",
      }),
      preset("preset_national", "اليوم الوطني", "National Day", {
        primaryColor: "#166534",
        announcementBar: "دام عزك يا وطن — خصومات اليوم الوطني",
      }),
    ],
  },
);
