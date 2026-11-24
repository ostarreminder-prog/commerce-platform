"use client";

import * as React from "react";
import {
  BotMessageSquare,
  Copy,
  MessageSquareText,
  UserRound,
  Voicemail,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { AfterHoursBehavior, WorkingDay } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "@repo/ui/lib/cn";
import { InheritBlock, Section, type TabProps } from "./shared";

const behaviours: { id: AfterHoursBehavior; icon: LucideIcon }[] = [
  { id: "reply", icon: BotMessageSquare },
  { id: "message", icon: MessageSquareText },
  { id: "voicemail", icon: Voicemail },
  { id: "human", icon: UserRound },
];

function isOpenNow(days: WorkingDay[]) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const now = `${get("hour").replace("24", "00")}:${get("minute")}`;
  const today = days.find((d) => d.day === day);
  return Boolean(today?.enabled && today.from <= now && now < today.to);
}

function OpenNow({ days }: { days: WorkingDay[] }) {
  const t = useTranslations("studio.detail.hours");
  const [open, setOpen] = React.useState<boolean | null>(null);
  React.useEffect(() => setOpen(isOpenNow(days)), [days]);
  if (open === null) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          open ? "bg-success animate-pulse" : "bg-muted-foreground",
        )}
        aria-hidden
      />
      {open ? t("openNow") : t("closedNow")}
    </span>
  );
}

export function HoursTab(props: TabProps) {
  const { draft, patch, readOnly } = props;
  const t = useTranslations("studio.detail.hours");
  const setDays = (fn: (d: WorkingDay[]) => WorkingDay[]) =>
    patch((a) => ({ ...a, workingHours: fn(a.workingHours) }));
  return (
    <div className="space-y-6">
      <Section title={t("title")} description={t("hint")}>
        <InheritBlock {...props} section="workingHours" tab="hours">
          {(source, locked) => {
            const days = source.workingHours;
            const update = (day: number, change: Partial<WorkingDay>) =>
              setDays((ds) => ds.map((d) => (d.day === day ? { ...d, ...change } : d)));
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <OpenNow days={days} />
                  {!locked ? (
                    <div className="ms-auto flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDays((ds) =>
                            ds.map((d) => ({ ...d, enabled: true, from: "00:00", to: "24:00" })),
                          )
                        }
                      >
                        {t("allDay")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const first = days.find((d) => d.day === 0);
                          if (first)
                            setDays((ds) =>
                              ds.map((d) => ({
                                ...d,
                                enabled: first.enabled,
                                from: first.from,
                                to: first.to,
                              })),
                            );
                        }}
                      >
                        <Copy aria-hidden /> {t("copySunday")}
                      </Button>
                    </div>
                  ) : null}
                </div>
                <ul className="divide-y rounded-xl border">
                  {days.map((d) => (
                    <li
                      key={d.day}
                      className={cn(
                        "flex flex-wrap items-center gap-3 p-3",
                        !d.enabled && "bg-muted/30",
                      )}
                    >
                      <Switch
                        checked={d.enabled}
                        onCheckedChange={(enabled) => update(d.day, { enabled })}
                        aria-label={t(`days.${d.day}` as "days.0")}
                      />
                      <span className="w-20 text-sm font-medium">
                        {t(`days.${d.day}` as "days.0")}
                      </span>
                      {d.enabled ? (
                        <div className="flex items-center gap-2" dir="ltr">
                          <input
                            type="time"
                            value={d.from}
                            onChange={(e) => update(d.day, { from: e.target.value })}
                            aria-label={t("from")}
                            className="num border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                          />
                          <span className="text-muted-foreground">–</span>
                          <input
                            type="time"
                            value={d.to === "24:00" ? "23:59" : d.to}
                            onChange={(e) => update(d.day, { to: e.target.value })}
                            aria-label={t("to")}
                            className="num border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">{t("closed")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }}
        </InheritBlock>
      </Section>
      <Section title={t("afterHours")} description={t("afterHoursHint")}>
        <fieldset
          disabled={readOnly}
          className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          role="radiogroup"
          aria-label={t("afterHours")}
        >
          {behaviours.map(({ id, icon: Icon }) => {
            const active = draft.afterHoursBehavior === id;
            const disabled = id === "voicemail" && !draft.channels.includes("voice");
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => patch((a) => ({ ...a, afterHoursBehavior: id }))}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                    : "hover:bg-muted/50",
                )}
              >
                <Icon
                  className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
                  aria-hidden
                />
                <span className="text-sm font-semibold">{t(`behaviours.${id}`)}</span>
                <span className="text-muted-foreground text-xs">{t(`behaviourHints.${id}`)}</span>
              </button>
            );
          })}
        </fieldset>
        {draft.afterHoursBehavior === "human" ? (
          <Alert variant="warning">
            <UserRound aria-hidden /> <AlertDescription>{t("humanWarning")}</AlertDescription>
          </Alert>
        ) : null}
      </Section>
    </div>
  );
}
