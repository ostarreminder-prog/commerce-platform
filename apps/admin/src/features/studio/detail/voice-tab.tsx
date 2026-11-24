"use client";

import * as React from "react";
import Link from "@/components/store-link";
import { AlertTriangle, ArrowUpRight, Check, Pause, Phone, Play, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgentVoices, usePhoneNumbers } from "@repo/api-client";
import type { VoiceSettings } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { cn } from "@repo/ui/lib/cn";
import { ancestry } from "../tree";
import { Field, NumberInput, Range, Section, type TabProps } from "./shared";
import { SwitchRow } from "./switch-row";

function Bars({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-5 items-end gap-0.5" aria-hidden>
      {[0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.8].map((h, i) => (
        <span
          key={i}
          className={cn(
            "bg-primary w-0.5 rounded-full transition-all",
            playing ? "animate-pulse" : "opacity-40",
          )}
          style={{ height: `${(playing ? h : 0.3) * 100}%`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </span>
  );
}

export function VoiceTab({ draft, patch, index, readOnly }: TabProps) {
  const t = useTranslations("studio.detail.voice");
  const td = useTranslations("studio.detail.persona.dialects");
  const { data: voices = [] } = useAgentVoices();
  const { data: phones = [] } = usePhoneNumbers();
  const [playing, setPlaying] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setPlaying(null), 2400);
    return () => window.clearTimeout(id);
  }, [playing]);
  const v = draft.voice;
  if (!v) return null;
  const set = (next: Partial<VoiceSettings>) =>
    patch((a) => ({ ...a, voice: { ...(a.voice as VoiceSettings), ...next } }));
  const root = ancestry(index, draft.id)[0] ?? draft;
  const linked = phones.filter((p) => p.agentId === draft.id);
  const rootLinked = phones.filter((p) => p.agentId === root.id);
  return (
    <div className="space-y-6">
      <Section title={t("numbers")} description={t("numbersHint")}>
        {linked.length ? (
          <ul className="flex flex-wrap gap-2">
            {linked.map((p) => (
              <li
                key={p.id}
                className="bg-muted/40 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
              >
                <Phone className="text-primary size-4" aria-hidden />
                <bdi className="num font-medium">{p.number}</bdi>
                <span className="text-muted-foreground text-xs">{p.provider}</span>
              </li>
            ))}
          </ul>
        ) : draft.parentId ? (
          <p className="text-muted-foreground text-sm">
            {t("viaRoot", { name: root.name, count: rootLinked.length })}
          </p>
        ) : (
          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              {t("noNumber")}
              <Link
                href="/agents/channels"
                className="text-primary inline-flex items-center gap-0.5 font-medium hover:underline"
              >
                {t("linkNumber")}
                <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </Section>
      <fieldset disabled={readOnly} className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Section title={t("voice")} description={t("voiceHint")}>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("voice")}>
            {voices.map((voice) => {
              const active = v.voiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    active && "border-primary bg-primary/5",
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set({ voiceId: voice.id })}
                    className="flex min-w-0 flex-1 items-center gap-3 text-start disabled:cursor-not-allowed"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        voice.gender === "female"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-info/10 text-info",
                      )}
                    >
                      {active ? <Check className="size-4" aria-hidden /> : voice.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{voice.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {t(voice.gender)} · {td(voice.dialect)}
                      </span>
                    </span>
                  </button>
                  <Bars playing={playing === voice.id} />
                  <button
                    type="button"
                    onClick={() => setPlaying(playing === voice.id ? null : voice.id)}
                    className="hover:bg-muted flex size-8 items-center justify-center rounded-full border"
                    aria-label={t("preview", { name: voice.name })}
                  >
                    {playing === voice.id ? (
                      <Pause className="size-3.5" aria-hidden />
                    ) : (
                      <Play className="size-3.5 rtl:-scale-x-100" aria-hidden />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <Field label={t("speed")} htmlFor="speed">
            <Range
              id="speed"
              value={v.speed}
              min={0.8}
              max={1.3}
              step={0.05}
              onChange={(speed) => set({ speed })}
              format={(x) => `${x.toFixed(2)}×`}
            />
          </Field>
          <Field label={t("pitch")} htmlFor="pitch">
            <Range
              id="pitch"
              value={v.pitch}
              min={-5}
              max={5}
              step={1}
              onChange={(pitch) => set({ pitch })}
              format={(x) => (x > 0 ? `+${x}` : String(x))}
            />
          </Field>
        </Section>
        <Section title={t("behaviour")}>
          <SwitchRow
            label={t("interruptible")}
            hint={t("interruptibleHint")}
            checked={v.interruptible}
            onChange={(interruptible) => set({ interruptible })}
          />
          <SwitchRow
            label={t("record")}
            hint={t("recordHint")}
            checked={v.recordCalls}
            onChange={(recordCalls) => set({ recordCalls })}
          />
          {v.recordCalls ? (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <ShieldCheck className="text-success size-3.5" aria-hidden /> {t("consent")}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("silence")} htmlFor="silence" hint={t("silenceHint")}>
              <NumberInput
                id="silence"
                value={v.silenceTimeoutSec}
                min={3}
                max={60}
                onChange={(silenceTimeoutSec) => set({ silenceTimeoutSec })}
                suffix={t("sec")}
              />
            </Field>
            <Field label={t("maxCall")} htmlFor="maxCall">
              <NumberInput
                id="maxCall"
                value={v.maxCallMinutes}
                min={1}
                max={60}
                onChange={(maxCallMinutes) => set({ maxCallMinutes })}
                suffix={t("min")}
              />
            </Field>
          </div>
        </Section>
      </fieldset>
    </div>
  );
}
