"use client";

import Link from "@/components/store-link";
import { useStorePathname as usePathname } from "@/lib/store-route";
import { Activity, FlaskConical, History, Network, PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@repo/ui/components/page-header";
import { cn } from "@repo/ui/lib/cn";

const tabs = [
  { key: "overview", href: "/agents", icon: Network },
  { key: "test", href: "/agents/test", icon: FlaskConical },
  { key: "live", href: "/agents/live", icon: Activity },
  { key: "history", href: "/agents/history", icon: History },
  { key: "channels", href: "/agents/channels", icon: PhoneCall },
] as const;

export function StudioHeader({ actions }: { actions?: React.ReactNode }) {
  const t = useTranslations("studio");
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("description")} actions={actions} />
      <nav aria-label={t("title")} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="bg-muted/60 inline-flex min-w-max gap-1 rounded-xl p-1">
          {tabs.map(({ key, href, icon: Icon }) => {
            const active = href === "/agents" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-visible:ring-ring flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {t(`tabs.${key}`)}
                  {key === "live" ? (
                    <span
                      className="bg-destructive size-1.5 animate-pulse rounded-full"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
