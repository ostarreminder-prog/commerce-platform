import {
  BadgeCheck,
  CircleHelp,
  FormInput,
  GalleryHorizontal,
  Grid2x2,
  Hexagon,
  History,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Package,
  PanelBottom,
  PanelTop,
  PanelsTopLeft,
  Play,
  ShoppingBag,
  Sparkles,
  Timer,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import type { z } from "zod";
import type { SectionType, ThemeSection } from "./types";
import { SECTION_DEFINITIONS } from "./definitions";
import { DEFAULTS } from "./defaults";
import { uid } from "./uid";
import { HeaderSection } from "./sections/header";
import { FooterSection } from "./sections/footer";
import { HeroSection } from "./sections/hero";
import { SliderSection } from "./sections/slider";
import { CategoriesSection } from "./sections/categories";
import { FeaturedProductsSection } from "./sections/featured-products";
import { BannerSection } from "./sections/banner";
import { ImageTextSection } from "./sections/image-text";
import { TestimonialsSection } from "./sections/testimonials";
import { FeaturesSection } from "./sections/features";
import { FaqSection } from "./sections/faq";
import { NewsletterSection } from "./sections/newsletter";
import { MainProductSection } from "./sections/main-product";
import { RichTextSection } from "./sections/rich-text";
import { VideoSection } from "./sections/video";
import { CollageSection } from "./sections/collage";
import { LogoListSection } from "./sections/logo-list";
import { ContactFormSection } from "./sections/contact-form";
import { MapSection } from "./sections/map";
import { CountdownSection } from "./sections/countdown";
import { TabsSection } from "./sections/tabs";
import { RecentlyViewedSection } from "./sections/recently-viewed";

export { uid };

export type SectionComponent = ComponentType<{ section: ThemeSection }>;

export interface SectionRegistryEntry {
  type: SectionType;
  /** Label key under the `msg` namespace: `sectionType.<type>`. */
  labelKey: string;
  icon: LucideIcon;
  schema: z.ZodTypeAny;
  /** Default settings + blocks for a newly added section (localized content is fixture data). */
  defaults: () => Pick<ThemeSection, "settings" | "blocks">;
  component: SectionComponent;
}

const entry = (type: SectionType, icon: LucideIcon, component: SectionComponent): SectionRegistryEntry => ({
  type,
  labelKey: `sectionType.${type}`,
  icon,
  schema: SECTION_DEFINITIONS[type].schema,
  defaults: () => structuredClone(DEFAULTS[type]),
  component,
});

export const SECTION_REGISTRY: Record<SectionType, SectionRegistryEntry> = {
  header: entry("header", PanelTop, HeaderSection),
  footer: entry("footer", PanelBottom, FooterSection),
  hero: entry("hero", Sparkles, HeroSection),
  slider: entry("slider", GalleryHorizontal, SliderSection),
  categories: entry("categories", LayoutGrid, CategoriesSection),
  "featured-products": entry("featured-products", ShoppingBag, FeaturedProductsSection),
  banner: entry("banner", Megaphone, BannerSection),
  "image-text": entry("image-text", ImageIcon, ImageTextSection),
  testimonials: entry("testimonials", MessageSquareQuote, TestimonialsSection),
  features: entry("features", BadgeCheck, FeaturesSection),
  faq: entry("faq", CircleHelp, FaqSection),
  newsletter: entry("newsletter", Mail, NewsletterSection),
  "main-product": entry("main-product", Package, MainProductSection),
  "rich-text": entry("rich-text", Type, RichTextSection),
  video: entry("video", Play, VideoSection),
  collage: entry("collage", Grid2x2, CollageSection),
  "logo-list": entry("logo-list", Hexagon, LogoListSection),
  "contact-form": entry("contact-form", FormInput, ContactFormSection),
  map: entry("map", MapPin, MapSection),
  countdown: entry("countdown", Timer, CountdownSection),
  tabs: entry("tabs", PanelsTopLeft, TabsSection),
  "recently-viewed": entry("recently-viewed", History, RecentlyViewedSection),
};

/** Create a new section with a generated id and the registry defaults. */
export function createSection(type: SectionType): ThemeSection {
  const { settings, blocks } = SECTION_REGISTRY[type].defaults();
  return { id: uid("sec"), type, hidden: false, settings, blocks };
}
