"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { SectionHeading, strSetting, useLocalized } from "./helpers";

const HEIGHT: Record<string, string> = {
  sm: "h-56",
  md: "h-80",
  lg: "h-96",
};

/**
 * Store location — embeds Google Maps when `lat`/`lng` are set (lazy iframe),
 * otherwise renders a styled placeholder card with a pin and the address text.
 */
export function MapSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const s = section.settings;
  const L = useLocalized(s);

  const lat = strSetting(s, "lat").trim();
  const lng = strSetting(s, "lng").trim();
  const hasCoords = Boolean(lat && lng);
  const address = L("address");
  const height = HEIGHT[strSetting(s, "height", "md")] ?? HEIGHT.md;

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} />
        {hasCoords ? (
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=15&output=embed`}
            title={L("title") || t("ourLocation")}
            loading="lazy"
            className={`${height} w-full rounded-2xl border`}
          />
        ) : (
          <div className={`${height} bg-muted/40 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border`}>
            <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <MapPin className="size-6" aria-hidden />
            </span>
            {address ? <p className="max-w-sm text-center text-sm font-medium">{address}</p> : null}
            <p className="text-muted-foreground text-xs">{t("ourLocation")}</p>
          </div>
        )}
        {hasCoords && address ? <p className="text-muted-foreground mt-3 text-center text-sm">{address}</p> : null}
      </div>
    </section>
  );
}
