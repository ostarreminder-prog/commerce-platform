"use client";

import * as React from "react";
import { type LucideIcon, Menu } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Sheet, SheetContent, SheetTitle } from "./sheet";

export interface WorkspaceNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
}

export interface WorkspaceShellProps {
  brand: React.ReactNode;
  nav: WorkspaceNavItem[];
  navLabel: string;
  openMenuLabel: string;
  actions?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  /** Renders a navigation link (e.g. next/link) so the shell stays router-agnostic. */
  renderLink: (props: { href: string; className: string; children: React.ReactNode; onClick?: () => void; "aria-current"?: "page" }) => React.ReactNode;
  children: React.ReactNode;
}

/** Sidebar + topbar layout shared by the platform consoles. */
export function WorkspaceShell({ brand, nav, navLabel, openMenuLabel, actions, sidebarFooter, renderLink, children }: WorkspaceShellProps) {
  const [open, setOpen] = React.useState(false);

  const content = (mobile: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b px-5", mobile && "pe-12")}>{brand}</div>
      <nav aria-label={navLabel} className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.href}>
              {renderLink({
                href: item.href,
                onClick: mobile ? () => setOpen(false) : undefined,
                "aria-current": item.active ? "page" : undefined,
                className: cn(
                  "focus-visible:ring-ring flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
                  item.active ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                ),
                children: (
                  <>
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="num bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none">{item.badge}</span>
                    ) : null}
                  </>
                ),
              })}
            </React.Fragment>
          );
        })}
      </nav>
      {sidebarFooter ? <div className="p-3">{sidebarFooter}</div> : null}
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh w-60 shrink-0 border-e lg:block">{content(false)}</aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="start" className="bg-sidebar w-72 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">{navLabel}</SheetTitle>
          {content(true)}
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/85 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={openMenuLabel} onClick={() => setOpen(true)}>
            <Menu aria-hidden />
          </Button>
          <div className="ms-auto flex items-center gap-1">{actions}</div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
