"use client";

import * as React from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar } from "../agent-meta";
import { Composer, ErrorBubble, type Props, Suggestions, time, useAutoScroll } from "./sim-shared";

function Waveform({ active, bars = 36 }: { active: boolean; bars?: number }) {
  return (
    <div className="flex h-16 items-center justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23));
        return (
          <span
            key={i}
            className={cn(
              "bg-paper w-1 rounded-full transition-all duration-300",
              active ? "animate-wave opacity-90" : "opacity-30",
            )}
            style={{
              height: active ? `${base * 100}%` : "12%",
              animationDelay: `${(i % 9) * 90}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

export function Voice(p: Props) {
  const t = useTranslations("studio.lab");
  const [state, setState] = React.useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const ref = useAutoScroll(p.turns.length + Number(p.pending));
  const lastAgent = [...p.turns].reverse().find((x) => x.agentId)?.agentId;
  const current = lastAgent ? p.index.byId.get(lastAgent) : p.index.roots[0];
  const count = p.turns.length;
  React.useEffect(() => {
    if (state !== "connected") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);
  React.useEffect(() => {
    if (state !== "ringing") return;
    const timer = setTimeout(() => setState("connected"), 1600);
    return () => clearTimeout(timer);
  }, [state]);
  React.useEffect(() => {
    if (!count || p.turns[count - 1]?.from !== "agent") return;
    setSpeaking(true);
    const timer = setTimeout(() => setSpeaking(false), 2600);
    return () => clearTimeout(timer);
  }, [count, p.turns]);
  const start = () => {
    p.onReset();
    setSeconds(0);
    setState("ringing");
  };
  const end = () => setState("ended");
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const live = state === "connected";
  return (
    <div className="from-ink to-ink/85 text-paper flex h-[620px] flex-col overflow-hidden rounded-2xl border bg-gradient-to-b">
      <div className="flex flex-col items-center gap-3 px-6 pb-4 pt-8 text-center">
        <div className="relative">
          {state === "ringing" ? (
            <span className="bg-paper/20 absolute inset-0 animate-ping rounded-full" aria-hidden />
          ) : null}
          {live && (speaking || p.pending) ? (
            <span
              className="bg-primary/40 absolute -inset-2 animate-pulse rounded-full"
              aria-hidden
            />
          ) : null}
          <span className="bg-paper/10 relative flex size-20 items-center justify-center rounded-full">
            {current ? (
              <AgentAvatar
                agent={current}
                size="lg"
                className="!bg-paper/90 size-16 rounded-full"
              />
            ) : (
              <Phone aria-hidden />
            )}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold">{t("storeName")}</p>
          <p className="num text-paper/70 text-sm">
            {state === "idle" && "920012345"} {state === "ringing" && t("ringing")}
            {state === "connected" && clock}
            {state === "ended" && t("callEnded", { time: clock })}
          </p>
        </div>
        {live && current ? (
          <p className="bg-paper/10 rounded-full px-3 py-1 text-xs">
            {p.pending
              ? t("thinking", { name: current.name })
              : speaking
                ? t("speaking", { name: current.name })
                : t("listening")}
          </p>
        ) : null}
        <Waveform active={live && (speaking || p.pending)} />
      </div>
      <div
        ref={ref}
        className="border-paper/10 flex-1 space-y-2.5 overflow-y-auto border-t px-4 py-3"
      >
        {state === "idle" ? (
          <p className="text-paper/60 py-6 text-center text-sm">{t("voiceIdle")}</p>
        ) : null}
        {p.turns.map((m) =>
          m.from === "error" ? (
            <ErrorBubble key={m.id} onRetry={p.onRetry} dark />
          ) : (
            <button
              key={m.id}
              type="button"
              disabled={m.from !== "agent"}
              onClick={() => p.onSelect(m.id)}
              className={cn(
                "flex w-full gap-3 rounded-lg p-1.5 text-start text-sm",
                p.selected === m.id && "bg-paper/10",
              )}
            >
              <span className="num text-paper/40 w-10 shrink-0 pt-0.5 text-[11px]">
                {time(m.at)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-paper/60 mb-0.5 block text-[11px] font-semibold">
                  {m.from === "customer"
                    ? t("you")
                    : (p.index.byId.get(m.agentId ?? "")?.name ?? "")}
                </span>
                <span dir="auto" className={m.from === "customer" ? "text-paper/80" : "text-paper"}>
                  {m.text}
                </span>
              </span>
            </button>
          ),
        )}
      </div>
      <div className="border-paper/10 space-y-3 border-t p-3">
        {live ? (
          <>
            {p.turns.length === 0 ? (
              <Suggestions items={p.suggestions} onPick={p.onSend} disabled={p.pending} dark />
            ) : null}
            <Composer
              onSend={p.onSend}
              disabled={p.pending || muted}
              placeholder={t("placeholderVoice")}
              tone="voice"
            />
          </>
        ) : null}
        <div className="flex items-center justify-center gap-4">
          {live ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "bg-paper/10 hover:bg-paper/20 hover:text-paper size-12 rounded-full",
                  muted && "bg-paper text-ink",
                )}
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? t("unmute") : t("mute")}
                aria-pressed={muted}
              >
                {muted ? <MicOff aria-hidden /> : <Mic aria-hidden />}
              </Button>
              <Button
                size="icon"
                className="bg-destructive hover:bg-destructive/90 size-14 rounded-full"
                onClick={end}
                aria-label={t("endCall")}
              >
                <PhoneOff aria-hidden />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="bg-paper/10 hover:bg-paper/20 hover:text-paper size-12 rounded-full"
                aria-label={t("speaker")}
              >
                <Volume2 aria-hidden />
              </Button>
            </>
          ) : (
            <Button
              className="bg-success hover:bg-success/90 h-12 rounded-full px-6"
              onClick={start}
              disabled={state === "ringing"}
            >
              <Phone aria-hidden /> {state === "ended" ? t("callAgain") : t("startCall")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
