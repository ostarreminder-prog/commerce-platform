import type { SectionType, ThemeSection } from "./types";
import { uid } from "./uid";

const block = (type: string, settings: Record<string, string>) => ({ id: uid("blk"), type, settings });

/* Default content per section type — Arabic copy here is fixture data, not UI chrome. */
export const DEFAULTS: Record<SectionType, Pick<ThemeSection, "settings" | "blocks">> = {
  header: {
    settings: { showAnnouncement: true, headerVariant: "default", showSearch: true, showCart: true, showAccount: true, showNav: true, sticky: true },
    blocks: [],
  },
  footer: {
    settings: {
      aboutAr: "متجر سعودي يوصلك أفضل المنتجات المختارة بعناية.",
      aboutEn: "A Saudi store bringing you carefully selected products.",
      columns: "3",
      showNewsletter: false,
      showSocial: true,
      copyrightAr: "جميع الحقوق محفوظة",
      copyrightEn: "All rights reserved",
    },
    blocks: [
      block("social-link", { platform: "instagram", url: "https://instagram.com/store" }),
      block("social-link", { platform: "x", url: "https://x.com/store" }),
    ],
  },
  hero: {
    settings: { layout: "split" },
    blocks: [
      block("badge", { labelAr: "تشكيلة مختارة", labelEn: "Curated selection" }),
      block("heading", { textAr: "تسوّق أفضل المنتجات السعودية", textEn: "Shop the best Saudi products", size: "lg" }),
      block("text", { contentAr: "تشكيلة مختارة بعناية، توصل لباب بيتك خلال أيام.", contentEn: "A curated selection delivered to your door within days." }),
      block("button", { labelAr: "تسوّق الآن", labelEn: "Shop now", url: "/", style: "solid" }),
    ],
  },
  slider: {
    settings: { titleAr: "عروض مميزة", titleEn: "Featured offers" },
    blocks: [
      block("slide", { titleAr: "خصم يصل إلى 30%", titleEn: "Up to 30% off", textAr: "على تشكيلة مختارة", textEn: "On selected items", ctaLabelAr: "تسوّق العرض", ctaLabelEn: "Shop the offer", hue: "20" }),
      block("slide", { titleAr: "وصل حديثاً", titleEn: "New arrivals", textAr: "اكتشف أحدث الإضافات", textEn: "Discover the latest additions", ctaLabelAr: "اكتشف", ctaLabelEn: "Explore", hue: "160" }),
      block("slide", { titleAr: "شحن مجاني", titleEn: "Free shipping", textAr: "للطلبات فوق 200 ر.س", textEn: "On orders over SAR 200", ctaLabelAr: "اطلب الآن", ctaLabelEn: "Order now", hue: "260" }),
    ],
  },
  categories: {
    settings: { titleAr: "تسوّق حسب التصنيف", titleEn: "Shop by category", columns: "6" },
    blocks: [],
  },
  "featured-products": {
    settings: { titleAr: "الأكثر مبيعاً", titleEn: "Best sellers", view: "adaptive-grid", limit: 8, showViewAll: true },
    blocks: [],
  },
  banner: {
    settings: {
      titleAr: "عرض لفترة محدودة",
      titleEn: "Limited-time offer",
      textAr: "خصومات تصل إلى 40% على مختارات الموسم.",
      textEn: "Up to 40% off this season's picks.",
      ctaLabelAr: "اغتنم العرض",
      ctaLabelEn: "Grab the deal",
      ctaUrl: "/",
    },
    blocks: [],
  },
  "image-text": {
    settings: {
      titleAr: "جودة تليق بك",
      titleEn: "Quality you deserve",
      textAr: "نختار كل منتج بعناية لنضمن لك تجربة تسوّق استثنائية.",
      textEn: "Every product is handpicked to guarantee an exceptional experience.",
      ctaLabelAr: "اعرف المزيد",
      ctaLabelEn: "Learn more",
      ctaUrl: "/",
      imageHue: 30,
      imageSide: "end",
    },
    blocks: [],
  },
  testimonials: {
    settings: { titleAr: "ماذا يقول عملاؤنا", titleEn: "What our customers say" },
    blocks: [
      block("testimonial", { name: "نورة", roleAr: "عميلة من الرياض", roleEn: "Customer from Riyadh", quoteAr: "تجربة تسوّق راقية والتوصيل كان أسرع مما توقعت.", quoteEn: "A classy shopping experience — delivery was faster than expected.", rating: "5" }),
      block("testimonial", { name: "عبدالله", roleAr: "عميل من جدة", roleEn: "Customer from Jeddah", quoteAr: "جودة المنتجات ممتازة وخدمة العملاء متعاونة جداً.", quoteEn: "Excellent product quality and very helpful support.", rating: "5" }),
      block("testimonial", { name: "سارة", roleAr: "عميلة من الدمام", roleEn: "Customer from Dammam", quoteAr: "أطلب منهم باستمرار، التغليف أنيق والمنتجات أصلية.", quoteEn: "I order regularly — elegant packaging and authentic products.", rating: "4" }),
    ],
  },
  features: {
    settings: { titleAr: "", titleEn: "", columns: "4" },
    blocks: [
      block("feature", { icon: "truck", titleAr: "شحن سريع", titleEn: "Fast shipping", textAr: "توصيل خلال 1-4 أيام لكل مدن المملكة.", textEn: "Delivery within 1-4 days across the Kingdom." }),
      block("feature", { icon: "shield", titleAr: "دفع آمن", titleEn: "Secure payment", textAr: "مدى وفيزا وآبل باي — بياناتك محمية.", textEn: "mada, Visa and Apple Pay — your data is safe." }),
      block("feature", { icon: "refresh", titleAr: "إرجاع سهل", titleEn: "Easy returns", textAr: "استرجاع مجاني خلال 7 أيام.", textEn: "Free returns within 7 days." }),
      block("feature", { icon: "chat", titleAr: "دعم على مدار الساعة", titleEn: "24/7 support", textAr: "فريقنا جاهز يخدمك في أي وقت.", textEn: "Our team is always here for you." }),
    ],
  },
  faq: {
    settings: { titleAr: "الأسئلة الشائعة", titleEn: "Frequently asked questions" },
    blocks: [
      block("qa", { qAr: "كم يستغرق التوصيل؟", qEn: "How long does delivery take?", aAr: "من 1 إلى 4 أيام عمل داخل المملكة.", aEn: "1–4 business days within the Kingdom." }),
      block("qa", { qAr: "هل يمكنني إرجاع المنتج؟", qEn: "Can I return a product?", aAr: "نعم، خلال 7 أيام من الاستلام بحالته الأصلية.", aEn: "Yes, within 7 days of delivery in its original condition." }),
      block("qa", { qAr: "ما هي طرق الدفع المتاحة؟", qEn: "Which payment methods are available?", aAr: "مدى، فيزا، آبل باي، والدفع عند الاستلام.", aEn: "mada, Visa, Apple Pay, and cash on delivery." }),
    ],
  },
  newsletter: {
    settings: {
      titleAr: "اشترك في نشرتنا",
      titleEn: "Join our newsletter",
      textAr: "كن أول من يعرف عن العروض والمنتجات الجديدة.",
      textEn: "Be the first to hear about offers and new products.",
      placeholderAr: "بريدك الإلكتروني",
      placeholderEn: "Your email address",
      buttonLabelAr: "اشترك",
      buttonLabelEn: "Subscribe",
    },
    blocks: [],
  },
  "main-product": {
    settings: { productId: "", gallerySide: "start" },
    blocks: [
      block("title", {}),
      block("price", { showCompare: "true" }),
      block("variant-picker", {}),
      block("quantity", {}),
      block("buy-button", { showBuyNow: "true" }),
      block("description", { source: "long" }),
      block("accordion", { titleAr: "الشحن والإرجاع", titleEn: "Shipping & returns", contentAr: "توصيل خلال 1-4 أيام وإرجاع مجاني خلال 7 أيام.", contentEn: "Delivery within 1-4 days and free returns within 7 days." }),
    ],
  },
  "rich-text": {
    settings: { alignment: "start" },
    blocks: [
      block("heading", { textAr: "عنوان القسم", textEn: "Section heading", size: "md" }),
      block("text", { contentAr: "اكتب هنا نصاً تعريفياً عن متجرك أو منتجاتك أو أي محتوى تحتاجه الصفحة.", contentEn: "Write here any intro copy about your store, products, or page content." }),
      block("button", { labelAr: "اعرف المزيد", labelEn: "Learn more", url: "/", style: "outline" }),
    ],
  },
  video: {
    settings: {
      videoUrl: "",
      poster: "",
      posterHue: 330,
      titleAr: "شاهد قصتنا",
      titleEn: "Watch our story",
      autoplay: false,
      muted: true,
    },
    blocks: [],
  },
  collage: {
    settings: { titleAr: "مختارات التحرير", titleEn: "Editor's picks" },
    blocks: [
      block("image", { hue: "30" }),
      block("promo-card", { titleAr: "عرض خاص", titleEn: "Special offer", textAr: "خصم يصل إلى 30% على مختارات الموسم.", textEn: "Up to 30% off this season's picks.", ctaLabelAr: "تسوّق الآن", ctaLabelEn: "Shop now", url: "/", hue: "25" }),
      block("product-card", {}),
    ],
  },
  "logo-list": {
    settings: { titleAr: "شركاؤنا", titleEn: "Our partners", marquee: false, grayscale: true },
    blocks: [
      block("logo", { name: "شريك ١", hue: "20" }),
      block("logo", { name: "شريك ٢", hue: "90" }),
      block("logo", { name: "شريك ٣", hue: "160" }),
      block("logo", { name: "شريك ٤", hue: "230" }),
    ],
  },
  "contact-form": {
    settings: {
      titleAr: "تواصل معنا",
      titleEn: "Contact us",
      textAr: "فريقنا جاهز للرد على استفساراتك.",
      textEn: "Our team is ready to answer your questions.",
      layout: "center",
      addressAr: "",
      addressEn: "",
      phone: "",
      email: "",
      showName: true,
      reqName: true,
      showEmail: true,
      reqEmail: true,
      showPhone: false,
      reqPhone: false,
      showSubject: true,
      reqSubject: false,
      showMessage: true,
      reqMessage: true,
      buttonLabelAr: "إرسال",
      buttonLabelEn: "Send",
    },
    blocks: [],
  },
  map: {
    settings: {
      titleAr: "موقعنا",
      titleEn: "Our location",
      addressAr: "الرياض، المملكة العربية السعودية",
      addressEn: "Riyadh, Saudi Arabia",
      lat: "24.7136",
      lng: "46.6753",
      height: "md",
    },
    blocks: [],
  },
  countdown: {
    settings: {
      titleAr: "العرض ينتهي خلال",
      titleEn: "Offer ends in",
      targetDate: "2026-12-31T21:00:00.000Z",
      expiredAr: "انتهى العرض — ترقّب عروضنا القادمة.",
      expiredEn: "Offer ended — stay tuned for what's next.",
      ctaLabelAr: "تسوّق العرض",
      ctaLabelEn: "Shop the offer",
      ctaUrl: "/",
    },
    blocks: [],
  },
  tabs: {
    settings: { titleAr: "", titleEn: "" },
    blocks: [
      block("tab", { labelAr: "الأكثر مبيعاً", labelEn: "Best sellers", contentAr: "", contentEn: "", productIds: "" }),
      block("tab", { labelAr: "وصل حديثاً", labelEn: "New arrivals", contentAr: "", contentEn: "", productIds: "" }),
    ],
  },
  "recently-viewed": {
    settings: { titleAr: "شاهدت مؤخراً", titleEn: "Recently viewed", limit: 8 },
    blocks: [],
  },
};
