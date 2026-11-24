import {
  BarChart3, Blocks, Bot, Boxes, FileText, FolderTree, Gift, Globe, Handshake, Home, Import, Layers, LibraryBig, ListTree, Megaphone,
  Images, MessagesSquare, Package, Paintbrush, Percent, RotateCcw, Search, Settings, ShieldCheck, ShoppingBag, ShoppingCart,
  Star, Store, Sparkles, Tag, Truck, Users, Wallet, Warehouse, Wand2, type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "home" | "copilot" | "orders" | "returns" | "abandonedCarts" | "customers"
  | "products" | "reviews" | "categories" | "collections" | "brands" | "inventory" | "imports" | "locations" | "priceLists"
  | "inbox" | "approvals" | "agents" | "knowledge"
  | "shipments" | "invoices"
  | "coupons" | "promotions" | "loyalty" | "giftCards" | "affiliates" | "reports"
  | "storefront" | "storeDesign" | "pages" | "menus" | "domains" | "seo" | "media" | "apps" | "appStore" | "settings";

export interface NavItem {
  key: NavKey;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  key: "sales" | "catalog" | "ai" | "operations" | "growth" | "store" | null;
  items: NavItem[];
}

/** Store-relative hrefs; `StoreLink` adds the `/[store]` prefix. */
export const navGroups: NavGroup[] = [
  { key: null, items: [{ key: "home", href: "/", icon: Home }] },
  {
    key: "sales",
    items: [
      { key: "orders", href: "/orders", icon: ShoppingBag },
      { key: "returns", href: "/returns", icon: RotateCcw },
      { key: "abandonedCarts", href: "/abandoned-carts", icon: ShoppingCart },
      { key: "customers", href: "/customers", icon: Users },
    ],
  },
  {
    key: "catalog",
    items: [
      { key: "products", href: "/products", icon: Package },
      { key: "reviews", href: "/reviews", icon: Star },
      { key: "categories", href: "/categories", icon: FolderTree },
      { key: "collections", href: "/collections", icon: Layers },
      { key: "brands", href: "/brands", icon: Tag },
      { key: "inventory", href: "/inventory", icon: Boxes },
      { key: "locations", href: "/inventory/locations", icon: Warehouse },
      { key: "priceLists", href: "/products/price-lists", icon: Wallet },
      { key: "imports", href: "/imports", icon: Import },
    ],
  },
  {
    key: "ai",
    items: [
      { key: "copilot", href: "/copilot", icon: Sparkles },
      { key: "inbox", href: "/inbox", icon: MessagesSquare },
      { key: "approvals", href: "/approvals", icon: ShieldCheck },
      { key: "agents", href: "/agents", icon: Bot },
      { key: "knowledge", href: "/knowledge", icon: LibraryBig },
    ],
  },
  {
    key: "operations",
    items: [
      { key: "shipments", href: "/shipments", icon: Truck },
      { key: "invoices", href: "/invoices", icon: FileText },
    ],
  },
  {
    key: "growth",
    items: [
      { key: "coupons", href: "/marketing/coupons", icon: Percent },
      { key: "promotions", href: "/marketing/promotions", icon: Megaphone },
      { key: "loyalty", href: "/marketing/loyalty", icon: Star },
      { key: "giftCards", href: "/marketing/gift-cards", icon: Gift },
      { key: "affiliates", href: "/marketing/affiliates", icon: Handshake },
      { key: "reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    key: "store",
    items: [
      { key: "storefront", href: "/storefront/themes", icon: Paintbrush },
      { key: "storeDesign", href: "/store-design", icon: Wand2 },
      { key: "pages", href: "/storefront/pages", icon: FileText },
      { key: "menus", href: "/storefront/menus", icon: ListTree },
      { key: "domains", href: "/storefront/domains", icon: Globe },
      { key: "seo", href: "/storefront/seo", icon: Search },
      { key: "media", href: "/media", icon: Images },
      { key: "apps", href: "/apps", icon: Blocks },
      { key: "appStore", href: "/apps/store", icon: Store },
      { key: "settings", href: "/settings/general", icon: Settings },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const section = href.split("/").slice(0, href.startsWith("/settings") ? 2 : 3).join("/");
  return pathname === href || pathname.startsWith(`${section}/`) || pathname === section;
}
export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
