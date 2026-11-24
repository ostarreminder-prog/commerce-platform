"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@repo/ui/components/page-header";
import { cn } from "@repo/ui/lib/cn";
import Link from "@/components/store-link";
import { SECTIONS, type Section } from "./settings-data";

/** Shared settings chrome: page header + section nav linking to the `/settings/*` routes. */
export function SettingsScaffold({ section, children }: { section: Section; children: React.ReactNode }) {
  const t = useTranslations("settings");
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] [&>*]:min-w-0">
        <nav aria-label={t("title")} className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map(({ id, icon: Icon, href }) => (
            <Link
              key={id}
              href={href}
              aria-current={section === id ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                section === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(`nav.${id}`)}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
