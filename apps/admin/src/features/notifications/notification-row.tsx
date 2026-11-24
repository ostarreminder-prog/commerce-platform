"use client";

import { Archive, ArchiveRestore, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMarkNotificationsRead, useSetNotificationArchived } from "@repo/api-client";
import type { AdminNotification } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { formatRelativeTime } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { EVENT_ICONS } from "./notifications-shared";

/** One row in the /notifications list — link + read/archive actions + entity ref. */
export function NotificationRow({ n }: { n: AdminNotification }) {
  const t = useTranslations("notifications");
  const te = useTranslations("topbar");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const markRead = useMarkNotificationsRead();
  const setArchived = useSetNotificationArchived();
  const Icon = EVENT_ICONS[n.event] ?? Archive;

  return (
    <li className={cn("flex items-start gap-3 px-4 py-3 sm:items-center", !n.read && "bg-primary/5")}>
      <span className="bg-muted text-muted-foreground mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full sm:mt-0">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={n.href}
          onClick={() => !n.read && markRead.mutate([n.id])}
          className="text-sm font-medium leading-snug underline-offset-4 hover:underline"
        >
          {te(`notificationEvents.${n.event}`, n.params)}
        </Link>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
          <span>{formatRelativeTime(n.at, locale)}</span>
          {n.ref ? (
            <span className="inline-flex items-center gap-1">
              · <EntityLink type={n.ref.type} id={n.ref.id} label={n.ref.label} className="text-xs" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!n.read ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("actions.markRead")}
            title={t("actions.markRead")}
            onClick={() => markRead.mutate([n.id], { onSuccess: () => mt.success("notifications.markedRead") })}
          >
            <Check className="size-4" aria-hidden />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={n.archived ? t("actions.unarchive") : t("actions.archive")}
          title={n.archived ? t("actions.unarchive") : t("actions.archive")}
          onClick={() =>
            setArchived.mutate([n.id, !n.archived], {
              onSuccess: () => mt.success(n.archived ? "notifications.unarchived" : "notifications.archived"),
            })
          }
        >
          {n.archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
        </Button>
        {!n.read ? <span className="bg-primary ms-1 size-2 shrink-0 rounded-full" aria-hidden /> : null}
      </div>
    </li>
  );
}
