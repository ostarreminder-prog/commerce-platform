"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { MaybeImage, boolSetting, numSetting, strSetting, useLocalized } from "./helpers";

const isYoutube = (url: string) => /youtube\.com|youtu\.be/.test(url);

/** Turn youtube watch/share urls into an embeddable src; pass embed urls through. */
function embedSrc(url: string): string {
  const id = /youtube\.com\/watch\?.*v=([\w-]+)/.exec(url)?.[1] ?? /youtu\.be\/([\w-]+)/.exec(url)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

/**
 * Video section — heavy media stays lazy: the poster renders until the visitor
 * presses play (or `autoplay` is on). Supports mp4 urls and youtube embed links.
 */
export function VideoSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const s = section.settings;
  const L = useLocalized(s);
  const [playing, setPlaying] = React.useState(false);

  const url = strSetting(s, "videoUrl");
  const muted = boolSetting(s, "muted", true);
  const title = L("title");
  const showPlayer = playing || (url && boolSetting(s, "autoplay"));

  return (
    <section className="sec-pad">
      <div className="container">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl">
          {showPlayer && url ? (
            isYoutube(url) ? (
              <iframe
                src={`${embedSrc(url)}?autoplay=1${muted ? "&mute=1" : ""}`}
                title={title || t("playVideo")}
                className="aspect-video w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={url} className="bg-ink aspect-video w-full" controls autoPlay muted={muted} playsInline>
                <track kind="captions" />
              </video>
            )
          ) : (
            <button
              type="button"
              className="group relative block w-full"
              onClick={() => url && setPlaying(true)}
              aria-label={t("playVideo")}
            >
              <MaybeImage
                url={strSetting(s, "poster")}
                hue={numSetting(s, "posterHue", 30)}
                label={title || "·"}
                className="aspect-video w-full"
              />
              <span aria-hidden className="bg-ink/35 absolute inset-0 flex items-center justify-center">
                <span className="bg-paper/90 text-ink flex size-16 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110">
                  <Play className="ms-1 size-7 fill-current" />
                </span>
              </span>
              {title ? (
                <span className="text-paper absolute bottom-4 start-5 text-lg font-semibold drop-shadow md:text-xl">{title}</span>
              ) : null}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
