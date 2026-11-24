import { z } from "zod";
import { bool, def, f, idList, loc, num, opts, str } from "./schemas-shared";
import { EXPERIENCE_IDS } from "./experiences/types";

/* ---- Section definitions: schema (validation/defaults) + fields (form meta) ---- */

const header = def(
  "header",
  z.object({
    ...loc("storeName"),
    showAnnouncement: bool(true),
    ...loc("announcement"),
    headerVariant: z.enum(["default", "centered", "search-prominent"]).default("default"),
    showSearch: bool(true),
    showCart: bool(true),
    showAccount: bool(true),
    showNav: bool(true),
    sticky: bool(true),
  }),
  [
    f("storeName", "localized"),
    f("showAnnouncement", "boolean"),
    f("announcement", "localized"),
    f("headerVariant", "select", { options: opts("default", "centered", "search-prominent") }),
    f("showSearch", "boolean"),
    f("showCart", "boolean"),
    f("showAccount", "boolean"),
    f("showNav", "boolean"),
    f("sticky", "boolean"),
  ],
  { deviceOverrides: ["headerVariant"] },
);

/**
 * Footer is menu-driven: the "footer" menu's top-level items become link
 * columns and its `social-link` blocks render the social row.
 */
const footer = def(
  "footer",
  z.object({
    ...loc("about"),
    columns: z.enum(["2", "3", "4"]).default("3"),
    showNewsletter: bool(false),
    ...loc("newsletterTitle"),
    ...loc("placeholder"),
    ...loc("buttonLabel"),
    showSocial: bool(true),
    ...loc("copyright"),
  }),
  [
    f("about", "localized"),
    f("columns", "select", { options: opts("2", "3", "4") }),
    f("showNewsletter", "boolean"),
    f("newsletterTitle", "localized", { labelKey: "title" }),
    f("placeholder", "localized"),
    f("buttonLabel", "localized"),
    f("showSocial", "boolean"),
    f("blocks", "blocks", { blockType: "social-link", max: 6, labelKey: "socialLinks" }),
    f("copyright", "localized"),
  ],
  { blocks: { types: ["social-link"], max: 6 } },
);

/** Hero is block-driven — content lives in `section.blocks` (heading/text/button/image/badge). */
const hero = def(
  "hero",
  z.object({
    layout: z.enum(["split", "center"]).default("split"),
    productIds: idList(),
  }),
  [
    f("layout", "select", { options: opts("split", "center") }),
    f("productIds", "entity-list", { entity: "product" }),
    f("blocks", "blocks", { blockTypes: ["badge", "heading", "text", "button", "image", "icon-item", "divider"], max: 8 }),
  ],
  {
    blocks: { types: ["badge", "heading", "text", "button", "image", "icon-item", "divider"], max: 8 },
    deviceOverrides: ["layout"],
  },
);

const slider = def(
  "slider",
  z.object({ ...loc("title") }),
  [
    f("title", "localized"),
    f("slides", "blocks", { blockType: "slide", max: 10 }),
  ],
);

const categories = def(
  "categories",
  z.object({
    ...loc("title"),
    categoryIds: idList(),
    columns: z.enum(["3", "4", "6"]).default("6"),
  }),
  [
    f("title", "localized"),
    f("categoryIds", "entity-list", { entity: "category" }),
    f("columns", "select", { options: opts("3", "4", "6") }),
  ],
  { deviceOverrides: ["columns"] },
);

const featuredProducts = def(
  "featured-products",
  z.object({
    ...loc("title"),
    ...loc("subtitle"),
    /** Commerce experience — resolves through EXPERIENCE_REGISTRY at render. */
    view: z.enum(EXPERIENCE_IDS).default("adaptive-grid"),
    productIds: idList(),
    limit: num(8),
    showViewAll: bool(true),
    /** Used by experiences that focus a single product (e.g. immersive-product). */
    productId: str(""),
    /* Experience-owned settings keys — declared here too so theme import's
     * schema parse doesn't strip them (visual-discovery below). */
    source: z.enum(["products", "categories"]).default("products"),
    categoryIds: idList(),
    density: z.enum(["compact", "normal"]).default("normal"),
    showPrice: bool(true),
    /* contextual-shopping */
    sceneImage: str(""),
    sceneHue: num(200),
    /* comparison */
    maxColumns: num(4),
    highlightDiffs: bool(true),
  }),
  [
    f("title", "localized"),
    f("subtitle", "localized"),
    f("view", "select", { optionsSource: "experiences", labelKey: "view" }),
    f("productIds", "entity-list", { entity: "product" }),
    f("limit", "number", { min: 1, max: 24 }),
    f("showViewAll", "boolean"),
  ],
  { deviceOverrides: ["limit", "showViewAll"] },
);

const banner = def(
  "banner",
  z.object({
    ...loc("title"),
    ...loc("text"),
    ...loc("ctaLabel"),
    ctaUrl: str("/"),
    background: str(""),
  }),
  [
    f("title", "localized"),
    f("text", "localized"),
    f("ctaLabel", "localized"),
    f("ctaUrl", "text"),
    f("background", "color"),
  ],
  { deviceOverrides: ["ctaUrl"] },
);

const imageText = def(
  "image-text",
  z.object({
    ...loc("title"),
    ...loc("text"),
    ...loc("ctaLabel"),
    ctaUrl: str("/"),
    image: str(""),
    imageHue: num(30),
    imageSide: z.enum(["start", "end"]).default("end"),
  }),
  [
    f("title", "localized"),
    f("text", "localized"),
    f("ctaLabel", "localized"),
    f("ctaUrl", "text"),
    f("image", "image"),
    f("imageHue", "number", { min: 0, max: 360 }),
    f("imageSide", "select", { options: opts("start", "end") }),
  ],
  { deviceOverrides: ["imageSide"] },
);

const testimonials = def(
  "testimonials",
  z.object({ ...loc("title") }),
  [
    f("title", "localized"),
    f("items", "blocks", { blockType: "testimonial", max: 12 }),
  ],
);

const features = def(
  "features",
  z.object({
    ...loc("title"),
    columns: z.enum(["2", "3", "4"]).default("4"),
  }),
  [
    f("title", "localized"),
    f("columns", "select", { options: opts("2", "3", "4") }),
    f("items", "blocks", { blockType: "feature", max: 8 }),
  ],
  { deviceOverrides: ["columns"] },
);

const faq = def(
  "faq",
  z.object({ ...loc("title") }),
  [
    f("title", "localized"),
    f("items", "blocks", { blockType: "qa", max: 20 }),
  ],
);

const newsletter = def(
  "newsletter",
  z.object({
    ...loc("title"),
    ...loc("text"),
    ...loc("placeholder"),
    ...loc("buttonLabel"),
  }),
  [
    f("title", "localized"),
    f("text", "localized"),
    f("placeholder", "localized"),
    f("buttonLabel", "localized"),
  ],
);

/** Product-page main section — resolves the context product, content is block-driven. */
const mainProduct = def(
  "main-product",
  z.object({
    productId: str(""),
    gallerySide: z.enum(["start", "end"]).default("start"),
  }),
  [
    f("productId", "entity-ref", { entity: "product" }),
    f("gallerySide", "select", { options: opts("start", "end") }),
    f("blocks", "blocks", {
      blockTypes: ["title", "price", "variant-picker", "quantity", "buy-button", "description", "accordion", "badge", "heading", "text", "divider"],
      max: 12,
    }),
  ],
  {
    blocks: { types: ["title", "price", "variant-picker", "quantity", "buy-button", "description", "accordion", "badge", "heading", "text", "divider"], max: 12 },
    deviceOverrides: ["gallerySide"],
  },
);

/** Original section defs — merged with `schemas-new.ts` in `definitions.ts`. */
export const BASE_SECTION_DEFINITIONS = {
  header,
  footer,
  hero,
  slider,
  categories,
  "featured-products": featuredProducts,
  banner,
  "image-text": imageText,
  testimonials,
  features,
  faq,
  newsletter,
  "main-product": mainProduct,
};
