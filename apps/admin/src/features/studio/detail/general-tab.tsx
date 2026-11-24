"use client";

import Link from "@/components/store-link";
import { AlertTriangle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, AgentChannel, AgentIcon } from "@repo/contracts";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/cn";
import {
  AgentAvatar,
  AgentStatusBadge,
  agentIcons,
  CHANNELS,
  channelIcons,
  useWarningText,
} from "../agent-meta";
import { AgentPicker } from "../agent-picker";
import { type AgentWarning, descendantIds } from "../tree";
import { Field, Section, type TabProps } from "./shared";

const HUES = [172, 152, 200, 220, 260, 290, 330, 20, 38, 0];

const defaultVoice = {
  voiceId: "v_fahad",
  speed: 1,
  pitch: 0,
  interruptible: true,
  silenceTimeoutSec: 8,
  maxCallMinutes: 15,
  recordCalls: true,
};
const defaultWhatsApp = {
  phoneNumberId: null,
  templates: [],
  replyDelaySec: 2,
  sendTypingIndicator: true,
};

export function GeneralTab({
  draft,
  patch,
  index,
  agents,
  readOnly,
  warnings,
  onAddChild,
}: TabProps & { warnings: AgentWarning[]; onAddChild: () => void }) {
  const t = useTranslations("studio.detail.general");
  const tc = useTranslations("studio.channel");
  const warnText = useWarningText();
  const children = index.children.get(draft.id) ?? [];
  const parent = draft.parentId ? index.byId.get(draft.parentId) : undefined;
  const toggleChannel = (c: AgentChannel, on: boolean) =>
    patch((a) => ({
      ...a,
      channels: on
        ? CHANNELS.filter((x) => x === c || a.channels.includes(x))
        : a.channels.filter((x) => x !== c),
      ...(on && c === "voice" && !a.voice ? { voice: defaultVoice } : {}),
      ...(on && c === "whatsapp" && !a.whatsapp ? { whatsapp: defaultWhatsApp } : {}),
    }));
  return (
    <div className="space-y-6">
      {warnings.length ? (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>{t("warningsTitle", { count: warnings.length })}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 ps-4">
              {warnings.map((w, i) => (
                <li key={i}>{warnText(w)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <fieldset disabled={readOnly} className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Section title={t("identity")} description={t("identityHint")}>
          <Field label={t("name")} htmlFor="agent-name">
            <Input
              id="agent-name"
              value={draft.name}
              maxLength={60}
              onChange={(e) => patch((a) => ({ ...a, name: e.target.value }))}
              aria-invalid={!draft.name.trim()}
            />
            {!draft.name.trim() ? (
              <p className="text-destructive text-xs">{t("nameRequired")}</p>
            ) : null}
          </Field>
          <Field label={t("icon")}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("icon")}>
              {(Object.keys(agentIcons) as AgentIcon[]).map((icon) => {
                const Icon = agentIcons[icon];
                const active = draft.avatar.icon === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={icon}
                    onClick={() => patch((a) => ({ ...a, avatar: { ...a.avatar, icon } }))}
                    className={cn(
                      "hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors",
                      active && "border-primary bg-primary/10 text-primary ring-primary/20 ring-2",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={t("color")}>
            <div
              className="flex flex-wrap items-center gap-2"
              role="radiogroup"
              aria-label={t("color")}
            >
              {HUES.map((hue) => (
                <button
                  key={hue}
                  type="button"
                  role="radio"
                  aria-checked={draft.avatar.hue === hue}
                  aria-label={String(hue)}
                  onClick={() => patch((a) => ({ ...a, avatar: { ...a.avatar, hue } }))}
                  className={cn(
                    "ring-offset-background size-7 rounded-full transition-transform hover:scale-110",
                    draft.avatar.hue === hue && "ring-foreground ring-2 ring-offset-2",
                  )}
                  style={{ background: `hsl(${hue} 60% 50%)` }}
                />
              ))}
              <span className="text-muted-foreground mx-2 text-xs">→</span>
              <AgentAvatar agent={draft} />
            </div>
          </Field>
        </Section>
        <Section title={t("placement")} description={t("placementHint")}>
          <Field label={t("parent")} hint={parent ? t("parentHint") : t("rootHint")}>
            <AgentPicker
              agents={agents}
              value={draft.parentId}
              onChange={(parentId) =>
                patch((a) => ({ ...a, parentId, role: parentId ? "specialist" : "orchestrator" }))
              }
              exclude={[draft.id, ...descendantIds(index, draft.id)]}
              noneLabel={t("noParent")}
            />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("children", { count: children.length })}
              </span>
              {!readOnly ? (
                <Button type="button" size="sm" variant="ghost" onClick={onAddChild}>
                  <Plus aria-hidden /> {t("addChild")}
                </Button>
              ) : null}
            </div>
            {children.length ? (
              <div className="flex flex-wrap gap-2">
                {children.map((c: Agent) => (
                  <Link
                    key={c.id}
                    href={`/agents/${c.id}`}
                    className="hover:bg-muted inline-flex items-center gap-2 rounded-full border py-1 pe-3 ps-1 text-sm transition-colors"
                  >
                    <AgentAvatar
                      agent={c}
                      size="sm"
                      className="size-6 rounded-full [&_svg]:size-3"
                    />
                    {c.name}
                    <AgentStatusBadge status={c.status} className="px-1.5 py-0 text-[10px]" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-center text-xs">
                {t("noChildren")}
              </p>
            )}
          </div>
        </Section>
        <Section
          title={parent ? t("whenTitle", { parent: parent.name }) : t("aboutTitle")}
          description={parent ? t("whenHint") : t("aboutHint")}
        >
          <Textarea
            value={draft.description}
            rows={4}
            maxLength={300}
            onChange={(e) => patch((a) => ({ ...a, description: e.target.value }))}
            placeholder={t("descriptionPlaceholder")}
            aria-label={t("description")}
            className={cn(parent && !draft.description.trim() && "border-warning")}
          />
          <p className="num text-muted-foreground text-end text-xs">
            {draft.description.length}/300
          </p>
        </Section>
        <Section
          title={t("channels")}
          description={parent ? t("channelsChildHint") : t("channelsHint")}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {CHANNELS.map((c) => {
              const Icon = channelIcons[c];
              const on = draft.channels.includes(c);
              return (
                <label
                  key={c}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:disabled]:cursor-not-allowed",
                    on && "border-primary bg-primary/5",
                  )}
                >
                  <Icon
                    className={cn("size-5", on ? "text-primary" : "text-muted-foreground")}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium">{tc(c)}</span>
                  <Switch
                    checked={on}
                    onCheckedChange={(v) => toggleChannel(c, v)}
                    aria-label={tc(c)}
                  />
                </label>
              );
            })}
          </div>
        </Section>
      </fieldset>
    </div>
  );
}
