"use client";

import { Globe, MessageCircle, PenLine, Phone, Puzzle, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrderChannel } from "@repo/contracts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "../lib/cn";

const CHANNEL_ICONS: Record<OrderChannel, LucideIcon> = { storefront: Globe, whatsapp: MessageCircle, voice: Phone, manual: PenLine, app: Puzzle };
const CHANNEL_TONES: Record<OrderChannel, string> = {
  storefront: "text-muted-foreground", whatsapp: "text-success", voice: "text-info", manual: "text-warning", app: "text-primary",
};

export function OrderChannelIcon({ channel, className }: { channel: OrderChannel; className?: string }) {
  const t = useTranslations("channels");
  const Icon = CHANNEL_ICONS[channel];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" aria-label={t(channel)}>
          <Icon className={cn("size-4 shrink-0", CHANNEL_TONES[channel], className)} aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent>{t(channel)}</TooltipContent>
    </Tooltip>
  );
}
