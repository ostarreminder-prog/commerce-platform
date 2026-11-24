"use client";

import { AlertTriangle, Bell, Bot, CreditCard, FileWarning, MessageCircle, Puzzle, RotateCcw, ShoppingBag, Truck, Gauge, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMarkNotificationsRead, useNotificationList } from "@repo/api-client";
import type { AdminNotificationEvent } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatRelativeTime } from "@repo/ui/lib/format";
import Link from "@/components/store-link";

const ICONS: Record<AdminNotificationEvent, LucideIcon> = {
  order_created: ShoppingBag, payment_failed: CreditCard, conversation_waiting: MessageCircle, approval_requested: Bot, low_stock: AlertTriangle,
  shipments_delayed: Truck, invoice_rejected: FileWarning, return_requested: RotateCcw, app_installed: Puzzle, usage_limit: Gauge,
};

/** Every notification is a deep link to its target (SCREENS_SPEC §8). */
export function Notifications() {
  const t = useTranslations("topbar");
  const { locale } = useAppLocale();
  const { data, isPending } = useNotificationList();
  const markRead = useMarkNotificationsRead();
  const unread = data?.filter((i) => !i.read).length ?? 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notifications")}>
          <Bell aria-hidden />
          {unread > 0 ? <span className="bg-destructive ring-background absolute end-2 top-2 size-2 rounded-full ring-2" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("notifications")}</p>
          <button type="button" className="text-primary text-xs font-medium hover:underline disabled:opacity-50" disabled={!unread} onClick={() => markRead.mutate([undefined])}>
            {t("markAllRead")}
          </button>
        </div>
        {isPending ? (
          <div className="space-y-2 p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
        ) : !data?.length ? (
          <p className="text-muted-foreground p-6 text-center text-sm">{t("noNotifications")}</p>
        ) : (
          <>
          <ul className="max-h-96 divide-y overflow-y-auto">
            {data.map((n) => {
              const Icon = ICONS[n.event];
              return (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => !n.read && markRead.mutate([n.id])} className={cn("hover:bg-muted/50 flex gap-3 px-4 py-3", !n.read && "bg-primary/5")}>
                    <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-sm leading-snug">{t(`notificationEvents.${n.event}`, n.params)}</span>
                      <span className="text-muted-foreground block text-xs">{formatRelativeTime(n.at, locale)}</span>
                    </span>
                    {!n.read ? <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-hidden /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t p-2">
            <Link href="/notifications" className="text-primary block rounded-md px-3 py-1.5 text-center text-xs font-medium hover:underline">
              {t("viewAll")}
            </Link>
          </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
