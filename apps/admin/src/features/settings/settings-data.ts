import { Bell, Braces, Building2, CreditCard, Crown, Globe2, MessagesSquare, Percent, ScrollText, ShieldAlert, ShieldCheck, Sparkles, Truck, UserCircle2, Users, Wrench } from "lucide-react";

/** Settings sections (spec §5.24) — each is a real route under `/[store]/settings/*`. */
export const SECTIONS = [
  { id: "profile", icon: UserCircle2, href: "/settings/profile" },
  { id: "general", icon: Building2, href: "/settings/general" },
  { id: "regional", icon: Globe2, href: "/settings/regional" },
  { id: "payments", icon: CreditCard, href: "/settings/payments" },
  { id: "shipping", icon: Truck, href: "/settings/shipping" },
  { id: "taxes", icon: Percent, href: "/settings/taxes" },
  { id: "notifications", icon: Bell, href: "/settings/notifications" },
  { id: "channels", icon: MessagesSquare, href: "/settings/channels" },
  { id: "staff", icon: Users, href: "/settings/staff" },
  { id: "roles", icon: ShieldCheck, href: "/settings/roles" },
  { id: "audit", icon: ScrollText, href: "/settings/audit" },
  { id: "billing", icon: Crown, href: "/settings/billing" },
  { id: "developers", icon: Braces, href: "/settings/developers" },
  { id: "copilot", icon: Sparkles, href: "/settings/copilot" },
  { id: "maintenance", icon: Wrench, href: "/settings/maintenance" },
  { id: "danger", icon: ShieldAlert, href: "/settings/danger" },
] as const;
export type Section = (typeof SECTIONS)[number]["id"];
