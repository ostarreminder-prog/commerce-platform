"use client";

import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AgentDialect, AgentTone } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/cn";
import { Field, InheritBlock, Section, type TabProps } from "./shared";

const TONES: AgentTone[] = ["friendly", "formal", "concise"];
const DIALECTS: AgentDialect[] = ["najdi", "hijazi", "gulf", "msa"];
const LANGS = ["ar", "en", "auto"] as const;
const SNIPPETS = ["noPrices", "confirmOrder", "escalate", "shortAnswers"] as const;

export function PersonaTab(props: TabProps) {
  const { draft, patch, readOnly } = props;
  const t = useTranslations("studio.detail.persona");
  return (
    <div className="space-y-6">
      <Section title={t("title")} description={t("hint")}>
        <InheritBlock {...props} section="persona" tab="persona">
          {(source) => {
            const p = source.persona;
            const set = (next: Partial<typeof p>) =>
              patch((a) => ({ ...a, persona: { ...a.persona, ...next } }));
            return (
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-5">
                  <Field label={t("tone")}>
                    <div
                      className="grid gap-2 sm:grid-cols-3"
                      role="radiogroup"
                      aria-label={t("tone")}
                    >
                      {TONES.map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          role="radio"
                          aria-checked={p.tone === tone}
                          onClick={() => set({ tone })}
                          className={cn(
                            "rounded-xl border p-3 text-start transition-colors disabled:cursor-not-allowed",
                            p.tone === tone ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                          )}
                        >
                          <span className="block text-sm font-semibold">{t(`tones.${tone}`)}</span>
                          <span className="text-muted-foreground mt-1 block text-xs">
                            {t(`toneSample.${tone}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("dialect")} htmlFor="dialect">
                      <Select
                        value={p.dialect}
                        onValueChange={(v) => set({ dialect: v as AgentDialect })}
                        disabled={source.id !== draft.id || readOnly}
                      >
                        <SelectTrigger id="dialect">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIALECTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {t(`dialects.${d}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t("language")} htmlFor="language">
                      <Select
                        value={p.language}
                        onValueChange={(v) => set({ language: v as (typeof LANGS)[number] })}
                        disabled={source.id !== draft.id || readOnly}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {t(`languages.${l}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label={t("greeting")} htmlFor="greeting" hint={t("greetingHint")}>
                    <Textarea
                      id="greeting"
                      rows={3}
                      value={p.greeting}
                      onChange={(e) => set({ greeting: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="bg-muted/40 rounded-xl border p-4">
                  <p className="text-muted-foreground mb-3 text-xs font-medium">{t("preview")}</p>
                  <div className="flex items-end gap-2">
                    <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
                      <Bot className="size-4" aria-hidden />
                    </span>
                    <p
                      dir="auto"
                      className="bg-card rounded-2xl rounded-es-sm border p-3 text-sm leading-relaxed shadow-sm"
                    >
                      {p.greeting || "…"}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{t(`tones.${p.tone}`)}</Badge>
                    <Badge variant="secondary">{t(`dialects.${p.dialect}`)}</Badge>
                  </div>
                </div>
              </div>
            );
          }}
        </InheritBlock>
      </Section>
      <Section title={t("instructions")} description={t("instructionsHint")}>
        <fieldset disabled={readOnly} className="min-w-0 space-y-3">
          <Textarea
            rows={10}
            value={draft.instructions}
            onChange={(e) => patch((a) => ({ ...a, instructions: e.target.value }))}
            aria-label={t("instructions")}
            className="font-mono text-[13px] leading-6"
            maxLength={4000}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {SNIPPETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    patch((a) => ({
                      ...a,
                      instructions: `${a.instructions.trimEnd()}\n- ${t(`snippets.${s}`)}`,
                    }))
                  }
                  className="hover:bg-muted rounded-full border px-2.5 py-1 text-xs disabled:opacity-50"
                >
                  + {t(`snippetLabels.${s}`)}
                </button>
              ))}
            </div>
            <span className="num text-muted-foreground text-xs">
              {draft.instructions.length}/4000
            </span>
          </div>
        </fieldset>
      </Section>
    </div>
  );
}
