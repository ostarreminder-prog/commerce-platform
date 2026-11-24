"use client";

import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Conversation } from "@repo/contracts";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import Link from "@/components/store-link";
import { CHANNEL_ICON, displayName } from "./inbox-utils";

export function ConversationRow({ c, active }: { c: Conversation; active: boolean }) {
  const t = useTranslations("inbox");
  const { locale } = useAppLocale();
  const Icon = CHANNEL_ICON[c.channel];
  const last = c.messages.at(-1);
  return (
    <Link
      href={`/inbox/${c.id}`}
      className={cn("hover:bg-accent/50 block border-b p-3 transition-colors", active && "bg-accent")}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-9 shrink-0"><AvatarFallback><UserRound className="size-4" /></AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{displayName(c)}</span>
            <span className="text-muted-foreground shrink-0 text-xs">{formatRelativeTime(c.updatedAt, locale, NOW)}</span>
          </div>
          <p className="text-muted-foreground truncate text-xs">{last?.type === "text" ? last.content : t(`messageTypes.${last?.type ?? "text"}`)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Icon className="text-muted-foreground size-3.5" aria-label={t(`channels.${c.channel}`)} />
            <StatusBadge entity="conversation" value={c.status} />
            {c.priority !== "normal" ? <Badge variant={c.priority === "urgent" ? "destructive" : "warning"} className="px-1.5 font-normal">{t(`priorities.${c.priority}`)}</Badge> : null}
            {c.sentiment === "negative" ? <Badge variant="outline" className="px-1.5 font-normal">{t("sentiments.negative")}</Badge> : null}
            {c.waitingSince ? <Badge variant="warning" className="px-1.5 font-normal">{t("waiting")}</Badge> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
