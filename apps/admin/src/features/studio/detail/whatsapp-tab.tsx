"use client";

import { MessageCircle, Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWhatsAppNumbers } from "@repo/api-client";
import type { WhatsAppSettings } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { ancestry } from "../tree";
import { Field, NumberInput, Section, type TabProps } from "./shared";
import { SwitchRow } from "./switch-row";

export function WhatsAppTab({ draft, patch, index, readOnly }: TabProps) {
  const t = useTranslations("studio.detail.whatsapp");
  const { data: numbers = [] } = useWhatsAppNumbers();
  const w = draft.whatsapp;
  if (!w) return null;
  const set = (next: Partial<WhatsAppSettings>) =>
    patch((a) => ({ ...a, whatsapp: { ...(a.whatsapp as WhatsAppSettings), ...next } }));
  const number = numbers.find((n) => n.id === w.phoneNumberId);
  const root = ancestry(index, draft.id)[0] ?? draft;
  const qualityTone = { high: "success", medium: "warning", low: "destructive" } as const;
  return (
    <fieldset disabled={readOnly} className="grid min-w-0 gap-6 xl:grid-cols-2">
      <Section
        title={t("number")}
        description={draft.parentId ? t("numberChildHint", { name: root.name }) : t("numberHint")}
      >
        <Select
          value={w.phoneNumberId ?? "none"}
          onValueChange={(id) => set({ phoneNumberId: id === "none" ? null : id, templates: [] })}
        >
          <SelectTrigger aria-label={t("number")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("inheritNumber")}</SelectItem>
            {numbers.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                <span className="flex items-center gap-2">
                  <MessageCircle className="text-success size-4" aria-hidden /> {n.displayName} ·
                  <bdi className="num">+{n.number}</bdi>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {number ? (
          <div className="bg-muted/40 grid grid-cols-3 gap-3 rounded-xl border p-3 text-center text-xs">
            <div>
              <p className="text-muted-foreground">{t("status")}</p>
              <p className="mt-1 font-semibold">{t(`statuses.${number.status}`)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("quality")}</p>
              <Badge variant={qualityTone[number.quality]} className="mt-1">
                {t(`qualities.${number.quality}`)}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{t("dailyLimit")}</p>
              <p className="num mt-1 font-semibold">{number.dailyLimit.toLocaleString("en")}</p>
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("templates")}</p>
          {number?.templates.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {number.templates.map((tpl) => (
                <li key={tpl}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm has-[:disabled]:cursor-not-allowed">
                    <Checkbox
                      checked={w.templates.includes(tpl)}
                      onCheckedChange={(v) =>
                        set({
                          templates: v
                            ? [...w.templates, tpl]
                            : w.templates.filter((x) => x !== tpl),
                        })
                      }
                    />
                    <code dir="ltr" className="text-xs">
                      {tpl}
                    </code>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">{t("noTemplates")}</p>
          )}
        </div>
      </Section>
      <Section title={t("behaviour")}>
        <Field label={t("delay")} htmlFor="delay" hint={t("delayHint")}>
          <NumberInput
            id="delay"
            value={w.replyDelaySec}
            min={0}
            max={30}
            onChange={(replyDelaySec) => set({ replyDelaySec })}
            suffix={t("sec")}
            className="w-40"
          />
        </Field>
        <SwitchRow
          label={t("typing")}
          hint={t("typingHint")}
          checked={w.sendTypingIndicator}
          onChange={(sendTypingIndicator) => set({ sendTypingIndicator })}
        />
        <div className="bg-wa-bg rounded-xl p-4">
          <div className="bg-wa-bubble-out text-wa-text ms-auto w-fit max-w-[80%] rounded-lg rounded-se-none px-3 py-2 text-sm shadow-sm">
            {t("sampleCustomer")}
          </div>
          {w.sendTypingIndicator ? (
            <div className="bg-paper mt-2 flex w-fit items-center gap-1 rounded-lg px-3 py-2">
              <Mic className="text-wa-green size-3" aria-hidden />
              <span className="text-ink/60 dark:text-paper/60 text-xs">
                {t("typingSample", { sec: w.replyDelaySec })}
              </span>
            </div>
          ) : null}
          <div
            dir="auto"
            className="bg-paper text-ink dark:text-paper mt-2 w-fit max-w-[80%] rounded-lg rounded-ss-none px-3 py-2 text-sm shadow-sm"
          >
            {draft.persona.greeting}
          </div>
        </div>
      </Section>
    </fieldset>
  );
}
