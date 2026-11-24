"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { strSetting, useLocalized } from "./helpers";

/** Two-digit Latin numeral (matches `.num` tabular convention). */
const pad = (v: number) => formatNumber(Math.max(0, v), { minimumIntegerDigits: 2, useGrouping: false });

/** Countdown to an ISO `targetDate` — days/hours/mins/secs boxes + expired message + CTA. */
export function CountdownSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { dir } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);
  const [now, setNow] = React.useState(() => Date.now());

  const target = Date.parse(strSetting(s, "targetDate"));
  const valid = Number.isFinite(target);

  React.useEffect(() => {
    if (!valid || target <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [valid, target]);

  const diff = valid ? Math.max(0, target - now) : 0;
  const expired = !valid || diff <= 0;
  const parts = [
    { label: t("days"), value: formatNumber(Math.floor(diff / 86_400_000), { useGrouping: false }) },
    { label: t("hours"), value: pad(Math.floor(diff / 3_600_000) % 24) },
    { label: t("minutes"), value: pad(Math.floor(diff / 60_000) % 60) },
    { label: t("seconds"), value: pad(Math.floor(diff / 1000) % 60) },
  ];
  const cta = L("ctaLabel");

  return (
    <section className="sec-pad">
      <div className="container flex flex-col items-center gap-6 text-center">
        {L("title") ? <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{L("title")}</h2> : null}
        {expired ? (
          <p className="text-muted-foreground">{L("expired") || t("offerEnded")}</p>
        ) : (
          <div className="flex items-stretch gap-3" dir="ltr">
            {parts.map((p) => (
              <div key={p.label} className="bg-card flex w-16 flex-col items-center gap-1 rounded-2xl border px-2 py-3 shadow-sm md:w-20 md:py-4">
                <span className="num text-xl font-bold tabular-nums md:text-2xl">{p.value}</span>
                <span className="text-muted-foreground text-[11px] font-medium">{p.label}</span>
              </div>
            ))}
          </div>
        )}
        {cta ? (
          <a
            href={strSetting(s, "ctaUrl", "/")}
            className="bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            {cta}
            <ArrowLeft className={cn("size-4", dir === "ltr" && "rotate-180")} aria-hidden />
          </a>
        ) : null}
      </div>
    </section>
  );
}
