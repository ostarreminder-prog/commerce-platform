"use client";

import { MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { EntityLink } from "@/components/entity/entity-link";
import { allNavItems, isActive } from "@/components/shell/nav";
import { useStorePathname } from "@/lib/store-route";
import { useCopilot } from "./copilot-context";

/** Top of the panel: the screen the user is on + any entities they selected elsewhere. */
export function ContextStrip() {
  const t = useTranslations();
  const strictT = useMsg();
  const tmsg = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const pathname = useStorePathname();
  const { selection, setSelection } = useCopilot();

  const screen = allNavItems.find((item) => isActive(pathname, item.href));
  const screenLabel = screen ? t(`nav.${screen.key}`) : pathname;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2 text-xs">
      <span className="text-muted-foreground inline-flex items-center gap-1">
        <MapPin className="size-3.5" aria-hidden />
        {tmsg("copilot.contextYou", { screen: screenLabel })}
      </span>
      {selection.length ? (
        <span className="ms-auto inline-flex items-center gap-1">
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-medium">
            {tmsg("copilot.selectedItems", { count: selection.length })}
          </span>
          {selection.slice(0, 3).map((entity) => (
            <span key={entity.id} className="bg-muted rounded-full px-2 py-0.5">
              <EntityLink type={entity.type} id={entity.id} label={entity.label} />
            </span>
          ))}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground rounded-full p-0.5"
            aria-label={t("common.cancel")}
            onClick={() => setSelection([])}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ) : null}
    </div>
  );
}
