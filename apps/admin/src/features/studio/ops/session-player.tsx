"use client";

import * as React from "react";
import { Gauge, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionRecord, TranscriptLine } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/cn";
import type { TreeIndex } from "../tree";
import { clock, TranscriptBubbles } from "./shared";

const BARS = 90;
const SPEEDS = [1, 1.5, 2] as const;

export function Player({ record, index }: { record: SessionRecord; index: TreeIndex }) {
  const t = useTranslations("studio.history.detail");
  const [pos, setPos] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<(typeof SPEEDS)[number]>(1);
  const total = record.durationSec;
  const heights = React.useMemo(
    () =>
      Array.from(
        { length: BARS },
        (_, i) => 0.2 + 0.8 * Math.abs(Math.sin(i * 0.53 + record.id.length) * Math.cos(i * 0.17)),
      ),
    [record.id],
  );
  React.useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setPos((p) => (p + 0.25 * speed >= total ? (setPlaying(false), total) : p + 0.25 * speed)),
      250,
    );
    return () => clearInterval(timer);
  }, [playing, speed, total]);
  const active = [...record.transcript].reverse().find((l) => l.atSec <= pos);
  const seek = (sec: number) => setPos(Math.min(total, Math.max(0, sec)));
  const onSeek = (l: TranscriptLine) => {
    seek(l.atSec);
    setPlaying(true);
  };
  const scroller = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!active || !playing) return;
    scroller.current
      ?.querySelector(`[data-line="${active.id}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active, playing]);
  return (
    <Card className="overflow-hidden">
      <div className="from-ink to-ink/85 text-paper space-y-3 bg-gradient-to-b p-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            className="bg-paper text-ink hover:bg-paper/90 size-11 shrink-0 rounded-full"
            onClick={() => (pos >= total ? (seek(0), setPlaying(true)) : setPlaying((p) => !p))}
            aria-label={playing ? t("pause") : t("play")}
          >
            {playing ? <Pause aria-hidden /> : <Play className="rtl:-scale-x-100" aria-hidden />}
          </Button>
          <div className="min-w-0 flex-1" dir="ltr">
            <div
              role="slider"
              tabIndex={0}
              aria-label={t("seek")}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={Math.round(pos)}
              aria-valuetext={clock(pos)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") seek(pos + 5);
                if (e.key === "ArrowLeft") seek(pos - 5);
                if (e.key === " ") {
                  e.preventDefault();
                  setPlaying((p) => !p);
                }
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - r.left) / r.width) * total);
              }}
              className="focus-visible:ring-paper/60 flex h-12 cursor-pointer items-center gap-[2px] rounded focus-visible:outline-none focus-visible:ring-2"
            >
              {heights.map((h, i) => {
                const lineAt = record.transcript.find(
                  (l) => Math.floor((l.atSec / total) * BARS) === i,
                );
                return (
                  <span
                    key={i}
                    className={cn(
                      "relative flex-1 rounded-full",
                      i / BARS <= pos / total
                        ? lineAt?.speaker === "customer"
                          ? "bg-info/50"
                          : "bg-success/50"
                        : "bg-paper/25",
                    )}
                    style={{ height: `${h * 100}%` }}
                  />
                );
              })}
            </div>
            <div className="num text-paper/60 mt-1 flex justify-between text-[11px]">
              <span>{clock(pos)}</span> <span>{clock(total)}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="num text-paper hover:bg-paper/10 hover:text-paper shrink-0"
            onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length] ?? 1)}
            aria-label={t("speed")}
          >
            <Gauge aria-hidden /> {speed}x
          </Button>
        </div>
        <p className="text-paper/60 flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-success/50 size-2 rounded-full" aria-hidden />
            {t("agentVoice")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-info/50 size-2 rounded-full" aria-hidden />
            {t("customerVoice")}
          </span>
          <span className="ms-auto">{t("clickToSeek")}</span>
        </p>
      </div>
      <div ref={scroller} className="max-h-[520px] overflow-y-auto p-4 [&_li]:scroll-mt-4">
        <TranscriptBubbles
          lines={record.transcript}
          index={index}
          activeId={active?.id ?? null}
          onSeek={onSeek}
        />
      </div>
    </Card>
  );
}
