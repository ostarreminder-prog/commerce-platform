"use client";

import { ArrowLeft } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import type { ThemeSection } from "../types";
import { MaybeImage, numSetting, strSetting, useLocalized } from "./helpers";

export function ImageTextSection({ section }: { section: ThemeSection }) {
  const { dir } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);

  const imageEnd = strSetting(s, "imageSide", "end") === "end";
  const cta = L("ctaLabel");

  return (
    <section className="sec-pad-lg">
      <div className="container grid items-center gap-10 md:grid-cols-2">
        <MaybeImage
          url={strSetting(s, "image")}
          hue={numSetting(s, "imageHue", 30)}
          label={L("title") || "·"}
          className={cn("aspect-[4/3] w-full rounded-2xl shadow-sm", imageEnd ? "md:order-2" : "md:order-1")}
        />
        <div className={cn("space-y-5", imageEnd ? "md:order-1" : "md:order-2")}>
          {L("title") ? <h2 className="text-2xl font-bold leading-tight tracking-tight md:text-4xl">{L("title")}</h2> : null}
          {L("text") ? <p className="text-muted-foreground max-w-lg leading-relaxed">{L("text")}</p> : null}
          {cta ? (
            <a href={strSetting(s, "ctaUrl", "/")} className="text-primary inline-flex items-center gap-2 font-semibold hover:underline">
              {cta}
              <ArrowLeft className={cn("size-4", dir === "ltr" && "rotate-180")} aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
