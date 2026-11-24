"use client";

import Link from "@/components/store-link";
import { useStorePathname as usePathname } from "@/lib/store-route";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useApprovals, useBilling, useConversationList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { isActive, navGroups } from "./nav";
import { StoreSwitcher, useCurrentStore } from "./store-switcher";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: conversations } = useConversationList();
  const { data: approvals } = useApprovals();
  const { data: store } = useCurrentStore();
  const { data: billing } = useBilling();
  const unread = conversations?.filter((c) => c.status === "waiting_human").length ?? 0;
  const pendingApprovals = approvals?.filter((a) => a.status === "pending").length ?? 0;
  const badgeFor = (key: string) => (key === "inbox" ? unread : key === "approvals" ? pendingApprovals : 0);
  /* Show the usage metric closest to its limit — honest capacity signal. */
  const topUsage = billing?.usage.length
    ? billing.usage.reduce((max, u) => (u.used / u.limit > max.used / max.limit ? u : max))
    : undefined;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className={cn("p-3", onNavigate && "pe-12")}>
        <StoreSwitcher />
      </div>
      <nav aria-label={t("nav.mainNav")} className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.key ?? "root"} className="space-y-1">
            {group.key ? (
              <p className="text-muted-foreground px-3 pb-1 text-xs font-medium">
                {t(`nav.groups.${group.key}`)}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-visible:ring-ring flex h-8 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1">{t(`nav.${item.key}`)}</span>
                      {badgeFor(item.key) > 0 ? (
                        <span className="num bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                          {formatNumber(badgeFor(item.key))}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-sidebar-border m-3 mt-0 space-y-2.5 rounded-lg border p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="text-primary size-4" aria-hidden />
          {billing ? t("nav.plan", { plan: t(`plans.${billing.planId as "growth"}`) }) : store ? t("nav.plan", { plan: t(`plans.${store.plan.replace(/^plan_/, "") as "growth"}`) }) : null}
        </div>
        {topUsage ? (
          <div className="space-y-1.5">
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{t("nav.usage")}</span>
              <span className="num" dir="ltr">{`${formatNumber(topUsage.used)} / ${formatNumber(topUsage.limit)}`}</span>
            </div>
            <Progress value={(topUsage.used / topUsage.limit) * 100} aria-label={t("nav.usage")} />
          </div>
        ) : null}
        <Button variant="outline" size="sm" className="h-8 w-full" asChild>
          <Link href="/settings/billing">{t("nav.upgrade")}</Link>
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh w-64 shrink-0 border-e lg:block">
      <SidebarContent />
    </aside>
  );
}
