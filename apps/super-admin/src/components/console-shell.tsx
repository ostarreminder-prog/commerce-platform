"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow, Bot, Building2, CreditCard, Flag, Gauge, LayoutDashboard, Layers, ListChecks, Palette, Plug, ScrollText,
  Sparkles, UserCog, Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { WorkspaceShell } from "@repo/ui/components/workspace-shell";
import { setLocale } from "@/actions/locale";
import { CopilotPanel, CopilotToggle } from "@/features/copilot/copilot-panel";
import { CopilotProvider } from "@/features/copilot/copilot-context";

const NAV = [
  { href: "/", key: "overview", icon: LayoutDashboard },
  { href: "/copilot", key: "copilot", icon: Sparkles },
  { href: "/stores", key: "tenants", icon: Building2 },
  { href: "/plans", key: "plans", icon: Layers },
  { href: "/subscriptions", key: "subscriptions", icon: CreditCard },
  { href: "/usage", key: "usage", icon: Gauge },
  { href: "/ai-usage", key: "ai", icon: Bot },
  { href: "/apps-review", key: "appsReview", icon: AppWindow },
  { href: "/partners", key: "partners", icon: Users },
  { href: "/providers", key: "providers", icon: Plug },
  { href: "/jobs", key: "jobs", icon: ListChecks },
  { href: "/logs", key: "logs", icon: ScrollText },
  { href: "/flags", key: "flags", icon: Flag },
  { href: "/themes", key: "themes", icon: Palette },
  { href: "/team", key: "team", icon: UserCog },
] as const;

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <CopilotProvider>
    <WorkspaceShell
      brand={
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-foreground text-background flex size-8 items-center justify-center rounded-lg text-sm font-bold">{t("logoInitial")}</span>
          <span className="leading-tight">
            <span className="block text-sm font-bold">{t("brand")}</span>
            <span className="text-muted-foreground block text-[11px]">{t("console")}</span>
          </span>
        </Link>
      }
      nav={NAV.map((n) => ({
        href: n.href,
        label: t(n.key),
        icon: n.icon,
        active:
          n.href === "/"
            ? pathname === "/"
            : pathname.startsWith(n.href) || (n.href === "/stores" && pathname.startsWith("/tenants")),
      }))}
      navLabel={t("main")}
      openMenuLabel={t("openMenu")}
      renderLink={({ children: c, ...props }) => <Link {...props}>{c}</Link>}
      sidebarFooter={
        <div className="text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <span className="bg-success size-2 rounded-full" aria-hidden />
          {t("env")}
        </div>
      }
      actions={
        <>
          <CopilotToggle />
          <LocaleSwitcher onLocaleChange={setLocale} />
          <ThemeToggle />
          <Avatar className="ms-1 size-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{t("userInitials")}</AvatarFallback>
          </Avatar>
        </>
      }
    >
      {children}
    </WorkspaceShell>
    <CopilotPanel />
    </CopilotProvider>
  );
}
