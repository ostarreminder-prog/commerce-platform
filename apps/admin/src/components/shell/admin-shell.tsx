"use client";

import * as React from "react";
import { useStorePathname as usePathname } from "@/lib/store-route";
import { ExternalLink, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Kbd } from "@repo/ui/components/kbd";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/components/sheet";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { useHotkey } from "@repo/ui/hooks/use-hotkey";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { setLocale } from "@/actions/locale";
import { PermissionsProvider } from "@/lib/permissions";
import { CopilotPanel, CopilotToggle } from "@/features/copilot/copilot-panel";
import { CopilotProvider } from "@/features/copilot/copilot-context";
import { AppSidebar, SidebarContent } from "./app-sidebar";
import { CommandPalette } from "./command-palette";
import { MaintenanceBanner } from "./maintenance-banner";
import { Notifications } from "./notifications";
import { RouteGuard } from "./route-guard";
import { UserMenu } from "./user-menu";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const { dir } = useAppLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  useHotkey("k", () => setSearchOpen((open) => !open));

  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <PermissionsProvider>
    <CopilotProvider>
    <div className="flex min-h-dvh">
      <AppSidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="start" className="bg-sidebar w-72 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">{t("nav.mainNav")}</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/85 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t("nav.openMenu")}
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden />
          </Button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:bg-muted/60 focus-visible:ring-ring flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 sm:max-w-md"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{t("topbar.search")}</span>
            <Kbd className="ms-auto hidden sm:inline-flex">{dir === "rtl" ? "K ⌘" : "⌘ K"}</Kbd>
          </button>
          <div className="ms-auto flex items-center gap-1">
            <CopilotToggle />
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <a href="http://localhost:3001" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                {t("common.viewStore")}
              </a>
            </Button>
            <div className="hidden sm:block">
              <LocaleSwitcher onLocaleChange={setLocale} />
            </div>
            <ThemeToggle />
            <Notifications />
            <UserMenu />
          </div>
        </header>
        <MaintenanceBanner />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <CopilotPanel />
    </div>
    </CopilotProvider>
    </PermissionsProvider>
  );
}
