"use client";

import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { strSetting, useLocalized } from "./helpers";

export function BannerSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { dir } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);

  const background = strSetting(s, "background");
  const custom = /^#[0-9a-fA-F]{3,8}$/.test(background);
  const style: CSSProperties | undefined = custom ? { backgroundColor: background } : undefined;

  return (
    <section className={cn("text-primary-foreground", !custom && "bg-primary")} style={style}>
      <div className="container flex flex-col items-center gap-4 sec-pad text-center md:flex-row md:justify-between md:text-start">
        <div className="space-y-1.5">
          {L("title") ? <h2 className="text-xl font-bold md:text-2xl">{L("title")}</h2> : null}
          {L("text") ? <p className="text-sm opacity-85 md:text-base">{L("text")}</p> : null}
        </div>
        <a
          href={strSetting(s, "ctaUrl", "/")}
          className="bg-paper text-ink inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
        >
          {L("ctaLabel") || t("shopNow")}
          <ArrowLeft className={cn("size-4", dir === "ltr" && "rotate-180")} aria-hidden />
        </a>
      </div>
    </section>
  );
}
