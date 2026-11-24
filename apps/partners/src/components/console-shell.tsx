"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Blocks, FlaskConical, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { WorkspaceShell } from "@repo/ui/components/workspace-shell";
import { setLocale } from "@/actions/locale";

const NAV = [
  { href: "/", key: "overview", icon: LayoutDashboard },
  { href: "/apps", key: "apps", icon: Blocks },
  { href: "/test-stores", key: "testStores", icon: FlaskConical },
  { href: "/docs", key: "docs", icon: BookOpen },
] as const;

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <WorkspaceShell
      brand={
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-info text-paper flex size-8 items-center justify-center rounded-lg text-sm font-bold">{"</>"}</span>
          <span className="leading-tight">
            <span className="block text-sm font-bold">{t("brand")}</span>
            <span className="text-muted-foreground block text-[11px]">{t("console")}</span>
          </span>
        </Link>
      }
      nav={NAV.map((n) => ({ href: n.href, label: t(n.key), icon: n.icon, active: n.href === "/" ? pathname === "/" : pathname.startsWith(n.href) }))}
      navLabel={t("main")}
      openMenuLabel={t("openMenu")}
      renderLink={({ children: c, ...props }) => <Link {...props}>{c}</Link>}
      sidebarFooter={
        <div className="text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <span className="bg-success size-2 rounded-full" aria-hidden />
          {t("sandbox")}
        </div>
      }
      actions={
        <>
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
  );
}
