"use client";

import * as React from "react";
import { useCopilotSettings, useSaveCopilotSettings } from "@repo/api-client";
import type { CopilotSettings } from "@repo/contracts";
import { TOOL_REGISTRY } from "@repo/copilot";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";

/* Write/dangerous tools the admin can forbid — platform tools stay out of the
 * merchant surface. Names come straight from TOOL_REGISTRY (single source). */
const BLOCKABLE_TOOLS = TOOL_REGISTRY.filter(
  (tool) => (tool.kind === "write" || tool.kind === "dangerous") && !tool.name.startsWith("platform."),
);

/** The form body — rendered inside the settings scaffold at /settings/copilot. */
export function CopilotSettingsPanel() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const mt = useMsgToast();
  const { data: saved } = useCopilotSettings();
  const save = useSaveCopilotSettings();
  const [draft, setDraft] = React.useState<CopilotSettings | null>(null);

  React.useEffect(() => {
    if (saved && !draft) setDraft(saved);
  }, [saved, draft]);

  if (!draft) return <Skeleton className="h-64 w-full" />;

  const patch = (p: Partial<CopilotSettings>) => setDraft({ ...draft, ...p });
  const toggleConfirm = (key: keyof CopilotSettings["alwaysConfirm"], v: boolean) =>
    patch({ alwaysConfirm: { ...draft.alwaysConfirm, [key]: v } });
  const toggleBlocked = (name: string, blocked: boolean) =>
    patch({ blockedTools: blocked ? [...draft.blockedTools, name] : draft.blockedTools.filter((n) => n !== name) });

  const submit = () =>
    save.mutate([draft], {
      onSuccess: () => mt.success("copilot.settings.saved"),
      onError: () => mt.error("copilot.error"),
    });

  const confirmRows: { key: keyof CopilotSettings["alwaysConfirm"]; label: string; hint: string }[] = [
    { key: "write", label: "copilot.settings.confirmWrite", hint: "copilot.settings.confirmWriteHint" },
    { key: "dangerous", label: "copilot.settings.confirmDangerous", hint: "copilot.settings.confirmDangerousHint" },
    { key: "bulk", label: "copilot.settings.confirmBulk", hint: "copilot.settings.confirmBulkHint" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <section className="bg-card space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">{t("copilot.settings.confirmTitle")}</h2>
        {confirmRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={`confirm-${row.key}`} className="text-sm font-medium">
                {t(row.label)}
              </Label>
              <p className="text-muted-foreground text-xs">{t(row.hint)}</p>
            </div>
            <Switch
              id={`confirm-${row.key}`}
              checked={draft.alwaysConfirm[row.key]}
              onCheckedChange={(v) => toggleConfirm(row.key, v)}
            />
          </div>
        ))}
      </section>

      <section className="bg-card space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">{t("copilot.settings.blockedTitle")}</h2>
        <p className="text-muted-foreground text-xs">{t("copilot.settings.blockedHint")}</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {BLOCKABLE_TOOLS.map((tool) => {
            const checked = draft.blockedTools.includes(tool.name);
            return (
              <li key={tool.name}>
                <label
                  htmlFor={`block-${tool.name}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs transition-colors",
                    checked ? "border-destructive/40 bg-destructive/5" : "hover:bg-muted",
                  )}
                >
                  <Checkbox
                    id={`block-${tool.name}`}
                    className="mt-0.5"
                    checked={checked}
                    onCheckedChange={(v) => toggleBlocked(tool.name, v === true)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{tool.name}</span>
                    <span className="text-muted-foreground line-clamp-2">
                      {locale === "en" ? tool.descriptionEn : tool.descriptionAr}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-card space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">{t("copilot.settings.languageTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="copilot-language">{t("copilot.settings.language")}</Label>
            <Select value={draft.language} onValueChange={(v) => patch({ language: v as CopilotSettings["language"] })}>
              <SelectTrigger id="copilot-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{t("copilot.settings.langAr")}</SelectItem>
                <SelectItem value="en">{t("copilot.settings.langEn")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="copilot-dialect">{t("copilot.settings.dialect")}</Label>
            <Select value={draft.dialect} onValueChange={(v) => patch({ dialect: v as CopilotSettings["dialect"] })}>
              <SelectTrigger id="copilot-dialect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gulf">{t("copilot.settings.dialectGulf")}</SelectItem>
                <SelectItem value="fusha">{t("copilot.settings.dialectFusha")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Button disabled={save.isPending} onClick={submit}>
        {t("copilot.settings.save")}
      </Button>
    </div>
  );
}
