import {
  BadgeCheck,
  BadgePercent,
  Banknote,
  ChevronDown,
  CircleHelp,
  FileText,
  GalleryHorizontal,
  Hash,
  Heading,
  Heading1,
  Hexagon,
  Image as ImageIcon,
  Layers,
  ListChecks,
  MapPin,
  MessageSquareQuote,
  Minus,
  MousePointerClick,
  Package,
  Share2,
  ShoppingBag,
  Tag,
  Text,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";
import type { FieldMeta } from "./types";

/** Registered block kinds — generic content + section-specific blocks. */
export const BLOCK_TYPES = [
  "heading",
  "text",
  "button",
  "image",
  "icon-item",
  "badge",
  "divider",
  "slide",
  "testimonial",
  "qa",
  "feature",
  "title",
  "price",
  "variant-picker",
  "quantity",
  "buy-button",
  "description",
  "accordion",
  "social-link",
  "logo",
  "tab",
  "promo-card",
  "product-card",
  "hotspot",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export interface BlockRegistryEntry {
  type: BlockType;
  /** Label key under the `msg` namespace: `blockType.<type>`. */
  labelKey: string;
  icon: LucideIcon;
  /** Zod schema — validation + defaults for the flat block settings map. */
  schema: z.ZodTypeAny;
  /** Fields rendered by the blocks editor (order = render order). */
  fields: FieldMeta[];
  /** Settings applied to a newly added block. */
  defaults: Record<string, string>;
}

const str = (d = "") => z.string().default(d);
const loc = (base: string) => ({ [`${base}Ar`]: str(), [`${base}En`]: str() });
const f = (key: string, kind: FieldMeta["kind"], extra: Partial<FieldMeta> = {}): FieldMeta => ({
  key,
  kind,
  labelKey: key,
  ...extra,
});
const opt = (value: string) => ({ value, labelKey: value });
const opts = (...values: string[]) => values.map(opt);

const ICON_OPTIONS = opts("truck", "shield", "refresh", "gift", "star", "chat", "leaf", "gem");

const entry = (
  type: BlockType,
  icon: LucideIcon,
  schema: z.ZodTypeAny,
  fields: FieldMeta[],
  defaults: Record<string, string> = {},
): BlockRegistryEntry => ({ type, labelKey: `blockType.${type}`, icon, schema, fields, defaults });

export const BLOCK_REGISTRY: Record<BlockType, BlockRegistryEntry> = {
  /* ---- generic content blocks ---- */
  heading: entry(
    "heading",
    Heading,
    z.object({ ...loc("text"), size: z.enum(["md", "lg", "xl"]).default("lg") }),
    [f("text", "localized"), f("size", "select", { options: opts("md", "lg", "xl") })],
    { size: "lg" },
  ),
  text: entry("text", Text, z.object({ ...loc("content") }), [f("content", "localized")]),
  button: entry(
    "button",
    MousePointerClick,
    z.object({ ...loc("label"), url: str("/"), style: z.enum(["solid", "outline"]).default("solid") }),
    [f("label", "localized"), f("url", "text"), f("style", "select", { options: opts("solid", "outline") })],
    { url: "/", style: "solid" },
  ),
  image: entry("image", ImageIcon, z.object({ image: str(), hue: str("30") }), [f("image", "image"), f("hue", "number", { min: 0, max: 360 })], { hue: "30" }),
  "icon-item": entry(
    "icon-item",
    BadgeCheck,
    z.object({ icon: str("star"), ...loc("title"), ...loc("text") }),
    [f("icon", "select", { options: ICON_OPTIONS }), f("title", "localized"), f("text", "localized")],
    { icon: "star" },
  ),
  badge: entry("badge", Tag, z.object({ ...loc("label") }), [f("label", "localized")]),
  divider: entry("divider", Minus, z.object({}), []),

  /* ---- section-scoped blocks (existing collections) ---- */
  slide: entry(
    "slide",
    GalleryHorizontal,
    z.object({ ...loc("title"), ...loc("text"), ...loc("ctaLabel"), image: str(), hue: str("200") }),
    [f("title", "localized"), f("text", "localized"), f("ctaLabel", "localized"), f("image", "image"), f("hue", "number", { min: 0, max: 360 })],
    { hue: "200" },
  ),
  testimonial: entry(
    "testimonial",
    MessageSquareQuote,
    z.object({ name: str(), ...loc("role"), ...loc("quote"), rating: str("5") }),
    [f("name", "text"), f("role", "localized"), f("quote", "localized"), f("rating", "number", { min: 1, max: 5 })],
    { rating: "5" },
  ),
  qa: entry("qa", CircleHelp, z.object({ ...loc("q"), ...loc("a") }), [f("q", "localized"), f("a", "localized")]),
  feature: entry(
    "feature",
    BadgeCheck,
    z.object({ icon: str("star"), ...loc("title"), ...loc("text") }),
    [f("icon", "select", { options: ICON_OPTIONS }), f("title", "localized"), f("text", "localized")],
    { icon: "star" },
  ),

  /* ---- main-product blocks ---- */
  title: entry("title", Heading1, z.object({}), []),
  price: entry("price", Banknote, z.object({ showCompare: str("true") }), [f("showCompare", "boolean")], { showCompare: "true" }),
  "variant-picker": entry("variant-picker", ListChecks, z.object({}), []),
  quantity: entry("quantity", Hash, z.object({}), []),
  "buy-button": entry(
    "buy-button",
    ShoppingBag,
    z.object({ ...loc("buyLabel"), showBuyNow: str("true") }),
    [f("buyLabel", "localized"), f("showBuyNow", "boolean")],
    { showBuyNow: "true" },
  ),
  description: entry(
    "description",
    FileText,
    z.object({ source: z.enum(["short", "long"]).default("long") }),
    [f("source", "select", { options: opts("short", "long") })],
    { source: "long" },
  ),
  accordion: entry("accordion", ChevronDown, z.object({ ...loc("title"), ...loc("content") }), [f("title", "localized"), f("content", "localized")]),

  /* ---- footer blocks ---- */
  "social-link": entry(
    "social-link",
    Share2,
    z.object({
      platform: z.enum(["instagram", "x", "tiktok", "snapchat", "youtube", "whatsapp"]).default("instagram"),
      url: str(),
    }),
    [f("platform", "select", { options: opts("instagram", "x", "tiktok", "snapchat", "youtube", "whatsapp") }), f("url", "text")],
    { platform: "instagram" },
  ),

  /* ---- stage-C section blocks ---- */
  logo: entry(
    "logo",
    Hexagon,
    z.object({ image: str(), name: str(), hue: str("200") }),
    [f("image", "image"), f("name", "text"), f("hue", "number", { min: 0, max: 360 })],
    { hue: "200" },
  ),
  tab: entry(
    "tab",
    Layers,
    z.object({ ...loc("label"), ...loc("content"), productIds: str() }),
    [f("label", "localized"), f("content", "localized"), f("productIds", "entity-list", { entity: "product" })],
  ),
  "promo-card": entry(
    "promo-card",
    BadgePercent,
    z.object({ ...loc("title"), ...loc("text"), ...loc("ctaLabel"), url: str("/"), image: str(), hue: str("25") }),
    [
      f("title", "localized"),
      f("text", "localized"),
      f("ctaLabel", "localized"),
      f("url", "text"),
      f("image", "image"),
      f("hue", "number", { min: 0, max: 360 }),
    ],
    { url: "/", hue: "25" },
  ),
  "product-card": entry(
    "product-card",
    Package,
    z.object({ productId: str() }),
    [f("productId", "entity-ref", { entity: "product" })],
  ),

  /* ---- contextual-shopping block: product pin on a scene image (x/y = 0-100%) ---- */
  hotspot: entry(
    "hotspot",
    MapPin,
    z.object({ productId: str(), x: str("50"), y: str("50") }),
    [
      f("productId", "entity-ref", { entity: "product" }),
      f("x", "number", { min: 0, max: 100 }),
      f("y", "number", { min: 0, max: 100 }),
    ],
    { x: "50", y: "50" },
  ),
};

export const isBlockType = (type: string): type is BlockType => (BLOCK_TYPES as readonly string[]).includes(type);

/** Registry entry for a block type — undefined for unregistered legacy types. */
export const blockDef = (type: string): BlockRegistryEntry | undefined =>
  isBlockType(type) ? BLOCK_REGISTRY[type] : undefined;
