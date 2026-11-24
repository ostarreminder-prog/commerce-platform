import { z } from "zod";
import type { SectionDefinition } from "./types";
import { bool, def, f, loc, num, opts, str } from "./schemas-shared";

/* ---- Stage-C section definitions: schema (validation/defaults) + fields (form meta) ---- */

/** Block-driven free content (heading/text/button/divider) with an alignment setting. */
const richText = def(
  "rich-text",
  z.object({
    alignment: z.enum(["start", "center"]).default("start"),
  }),
  [
    f("alignment", "select", { options: opts("start", "center") }),
    f("blocks", "blocks", { blockTypes: ["heading", "text", "button", "divider"], max: 12 }),
  ],
  {
    blocks: { types: ["heading", "text", "button", "divider"], max: 12 },
    deviceOverrides: ["alignment"],
  },
);

/** mp4/youtube video — lazy: renders the poster until the visitor presses play. */
const video = def(
  "video",
  z.object({
    videoUrl: str(""),
    poster: str(""),
    posterHue: num(30),
    ...loc("title"),
    autoplay: bool(false),
    muted: bool(true),
  }),
  [
    f("videoUrl", "text"),
    f("poster", "image"),
    f("posterHue", "number", { min: 0, max: 360, labelKey: "imageHue" }),
    f("title", "localized"),
    f("autoplay", "boolean"),
    f("muted", "boolean"),
  ],
);

/** Asymmetric 2–4 item grid mixing image / promo-card / product-card blocks. */
const collage = def(
  "collage",
  z.object({ ...loc("title") }),
  [
    f("title", "localized"),
    f("blocks", "blocks", { blockTypes: ["image", "promo-card", "product-card"], min: 2, max: 4 }),
  ],
  { blocks: { types: ["image", "promo-card", "product-card"], max: 4 } },
);

/** Brand logos row — `logo` blocks, optional auto-scroll + grayscale-till-hover. */
const logoList = def(
  "logo-list",
  z.object({
    ...loc("title"),
    marquee: bool(false),
    grayscale: bool(true),
  }),
  [
    f("title", "localized"),
    f("marquee", "boolean"),
    f("grayscale", "boolean"),
    f("logos", "blocks", { blockType: "logo", max: 12 }),
  ],
);

/** Contact form — field toggles + required flags, split layout shows contact info. */
const contactForm = def(
  "contact-form",
  z.object({
    ...loc("title"),
    ...loc("text"),
    layout: z.enum(["center", "split"]).default("center"),
    ...loc("address"),
    phone: str(""),
    email: str(""),
    showName: bool(true),
    reqName: bool(true),
    showEmail: bool(true),
    reqEmail: bool(true),
    showPhone: bool(false),
    reqPhone: bool(false),
    showSubject: bool(true),
    reqSubject: bool(false),
    showMessage: bool(true),
    reqMessage: bool(true),
    ...loc("buttonLabel"),
  }),
  [
    f("title", "localized"),
    f("text", "localized"),
    f("layout", "select", { options: opts("center", "split") }),
    f("address", "localized"),
    f("phone", "text"),
    f("email", "text"),
    f("showName", "boolean"),
    f("reqName", "boolean"),
    f("showEmail", "boolean"),
    f("reqEmail", "boolean"),
    f("showPhone", "boolean"),
    f("reqPhone", "boolean"),
    f("showSubject", "boolean"),
    f("reqSubject", "boolean"),
    f("showMessage", "boolean"),
    f("reqMessage", "boolean"),
    f("buttonLabel", "localized"),
  ],
  { deviceOverrides: ["layout"] },
);

/** Google-maps iframe when lat/lng are set, styled placeholder card otherwise. */
const map = def(
  "map",
  z.object({
    ...loc("title"),
    ...loc("address"),
    lat: str(""),
    lng: str(""),
    height: z.enum(["sm", "md", "lg"]).default("md"),
  }),
  [
    f("title", "localized"),
    f("address", "localized"),
    f("lat", "text"),
    f("lng", "text"),
    f("height", "select", { options: opts("sm", "md", "lg") }),
  ],
  { deviceOverrides: ["height"] },
);

/** Countdown to an ISO targetDate — days/hours/mins/secs + expired message + CTA. */
const countdown = def(
  "countdown",
  z.object({
    ...loc("title"),
    targetDate: str(""),
    ...loc("expired"),
    ...loc("ctaLabel"),
    ctaUrl: str("/"),
  }),
  [
    f("title", "localized"),
    f("targetDate", "text"),
    f("expired", "localized", { labelKey: "expiredMessage" }),
    f("ctaLabel", "localized"),
    f("ctaUrl", "text"),
  ],
);

/** `tab` blocks — each tab shows localized content and/or a product grid. */
const tabs = def(
  "tabs",
  z.object({ ...loc("title") }),
  [f("title", "localized"), f("tabs", "blocks", { blockType: "tab", max: 8 })],
);

/** Visitor's last-viewed products strip — ids come from SectionData.recentlyViewedIds. */
const recentlyViewed = def(
  "recently-viewed",
  z.object({
    ...loc("title"),
    limit: num(8),
  }),
  [f("title", "localized"), f("limit", "number", { min: 1, max: 10 })],
  { deviceOverrides: ["limit"] },
);

export const NEW_SECTION_DEFINITIONS = {
  "rich-text": richText,
  video,
  collage,
  "logo-list": logoList,
  "contact-form": contactForm,
  map,
  countdown,
  tabs,
  "recently-viewed": recentlyViewed,
} satisfies Record<string, SectionDefinition>;
