import type { Domain, Menu, Page, SeoRedirect, StorefrontSeo } from "@repo/contracts";
import { daysAgo } from "../data/seed";

/**
 * Storefront management fixtures (§4.19): pages, menus, custom domains and
 * home-SEO settings for the merchant's `/[store]/storefront/*` screens.
 */

export const pages: Page[] = [
  {
    id: "page_about",
    title: { ar: "من نحن", en: "About us" },
    slug: "about",
    content: {
      ar: "بدأنا نخلة من شغف بسيط: نجمع أفضل منتجات المملكة — تمور، قهوة، عطور — في متجر واحد يوصل لباب بيتك.\n\nفريقنا يختار كل منتج بعناية ويتأكد من جودته قبل ما ينضم للمتجر.",
      en: "Nakhla started with a simple passion: gathering the best Saudi products — dates, coffee, perfumes — in one store delivered to your door.",
    },
    seo: { title: "من نحن | متجر نخلة", description: "تعرّف على قصة نخلة وفريقنا وكيف نختار منتجاتنا." },
    status: "published",
    showInMenu: true,
  },
  {
    id: "page_shipping",
    title: { ar: "سياسة الشحن والإرجاع", en: "Shipping & returns" },
    slug: "shipping-returns",
    content: {
      ar: "نوصل لكل مدن المملكة خلال 1-4 أيام عمل. الشحن مجاني للطلبات فوق 200 ر.س.\n\nالإرجاع مجاني خلال 7 أيام من الاستلام بشرط بقاء المنتج بحالته الأصلية.",
    },
    seo: { title: "سياسة الشحن والإرجاع | متجر نخلة", description: "مدة التوصيل، رسوم الشحن، وسياسة الإرجاع والاستبدال." },
    status: "published",
    showInMenu: true,
  },
  {
    id: "page_privacy",
    title: { ar: "سياسة الخصوصية", en: "Privacy policy" },
    slug: "privacy",
    content: {
      ar: "نحترم خصوصيتك. بياناتك تُستخدم فقط لتجهيز طلبك وتحسين تجربتك، ولا نشاركها مع أي طرف ثالث بدون موافقتك.",
    },
    seo: { title: "سياسة الخصوصية | متجر نخلة", description: "كيف نجمع بياناتك ونستخدمها ونحميها." },
    status: "published",
    showInMenu: false,
  },
  {
    id: "page_gift",
    title: { ar: "بطاقات الهدايا", en: "Gift cards" },
    slug: "gift-cards",
    content: {
      ar: "أهدِ من تحب بطاقة نخلة بأي مبلغ — توصلهم على الواتساب خلال دقائق ويستخدمونها بأي طلب.",
    },
    seo: { title: "بطاقات الهدايا | متجر نخلة", description: "بطاقات إهداء رقمية بقيمة تختارها." },
    status: "draft",
    showInMenu: false,
  },
];

export const menus: Menu[] = [
  {
    id: "menu_header",
    location: "header",
    items: [
      {
        id: "mi_home",
        label: { ar: "الرئيسية", en: "Home" },
        linkType: "url",
        targetId: null,
        url: "/",
        children: [],
      },
      {
        id: "mi_shop",
        label: { ar: "تسوق", en: "Shop" },
        linkType: "collection",
        targetId: "col_new",
        url: null,
        children: [
          { id: "mi_shop_perfume", label: { ar: "ركن العطور", en: "Perfume corner" }, linkType: "collection", targetId: "col_perfumes", url: null, children: [] },
          { id: "mi_shop_gifts", label: { ar: "أفكار الهدايا", en: "Gift ideas" }, linkType: "collection", targetId: "col_gifts", url: null, children: [] },
          { id: "mi_shop_under100", label: { ar: "بأقل من 100 ر.س", en: "Under 100 SAR" }, linkType: "collection", targetId: "col_under100", url: null, children: [] },
        ],
      },
      {
        id: "mi_dates",
        label: { ar: "القهوة والتمور", en: "Coffee & Dates" },
        linkType: "category",
        targetId: "cat_coffee",
        url: null,
        children: [],
      },
      {
        id: "mi_about",
        label: { ar: "من نحن", en: "About us" },
        linkType: "page",
        targetId: "page_about",
        url: null,
        children: [],
      },
    ],
  },
  {
    id: "menu_footer",
    location: "footer",
    items: [
      {
        id: "mi_f_shop",
        label: { ar: "المتجر", en: "Shop" },
        linkType: "url",
        targetId: null,
        url: "/",
        children: [
          { id: "mi_f_about", label: { ar: "من نحن", en: "About us" }, linkType: "page", targetId: "page_about", url: null, children: [] },
          { id: "mi_f_gifts", label: { ar: "بطاقات الهدايا", en: "Gift cards" }, linkType: "page", targetId: "page_gift", url: null, children: [] },
          { id: "mi_f_new", label: { ar: "وصل حديثاً", en: "New arrivals" }, linkType: "collection", targetId: "col_new", url: null, children: [] },
          { id: "mi_f_perfume", label: { ar: "ركن العطور", en: "Perfume corner" }, linkType: "collection", targetId: "col_perfumes", url: null, children: [] },
        ],
      },
      {
        id: "mi_f_help",
        label: { ar: "المساعدة", en: "Help" },
        linkType: "url",
        targetId: null,
        url: "#",
        children: [
          { id: "mi_f_shipping", label: { ar: "الشحن والإرجاع", en: "Shipping & returns" }, linkType: "page", targetId: "page_shipping", url: null, children: [] },
          { id: "mi_f_privacy", label: { ar: "سياسة الخصوصية", en: "Privacy policy" }, linkType: "page", targetId: "page_privacy", url: null, children: [] },
          { id: "mi_f_contact", label: { ar: "تواصل معنا", en: "Contact us" }, linkType: "url", targetId: null, url: "mailto:care@nakhla.sa", children: [] },
          { id: "mi_f_track", label: { ar: "تتبع طلبك", en: "Track your order" }, linkType: "url", targetId: null, url: "/order/track", children: [] },
        ],
      },
      {
        id: "mi_f_quick",
        label: { ar: "روابط سريعة", en: "Quick links" },
        linkType: "url",
        targetId: null,
        url: "#",
        children: [
          { id: "mi_f_home", label: { ar: "الرئيسية", en: "Home" }, linkType: "url", targetId: null, url: "/", children: [] },
          { id: "mi_f_search", label: { ar: "تسوّق الكل", en: "Shop all" }, linkType: "url", targetId: null, url: "/search", children: [] },
          { id: "mi_f_cart", label: { ar: "سلة التسوق", en: "Shopping cart" }, linkType: "url", targetId: null, url: "/cart", children: [] },
          { id: "mi_f_ig", label: { ar: "إنستغرام", en: "Instagram" }, linkType: "url", targetId: null, url: "https://instagram.com/nakhla", children: [] },
        ],
      },
    ],
  },
];

export const domains: Domain[] = [
  {
    id: "dom_default",
    hostname: "nakhla.store.sa",
    type: "subdomain",
    verificationStatus: "verified",
    sslStatus: "active",
    dnsRecords: [],
    isPrimary: true,
  },
  {
    id: "dom_custom",
    hostname: "shop.nakhla.sa",
    type: "custom",
    verificationStatus: "verified",
    sslStatus: "active",
    dnsRecords: [
      { type: "CNAME", name: "shop", value: "stores.store.sa" },
      { type: "TXT", name: "_store-verify.shop", value: "store-verify=nakhla-84f2" },
    ],
    isPrimary: false,
  },
];

export const seoRedirects: SeoRedirect[] = [
  { id: "red_1", from: "/old-dates", to: "/c/dates", createdAt: daysAgo(40, 10) },
  { id: "red_2", from: "/sale", to: "/collections/new-arrivals", createdAt: daysAgo(18, 14) },
];

export const storefrontSeo: StorefrontSeo = {
  title: "متجر نخلة | تمور وقهوة وهدايا من قلب المملكة",
  description: "تسوّق أجود التمور والقهوة والعطور مع توصيل سريع لكل مدن المملكة وإرجاع مجاني خلال 7 أيام.",
  shareImage: null,
};
