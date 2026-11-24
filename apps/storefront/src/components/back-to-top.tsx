"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/lib/cn";
import { useStoreFeatures } from "@/lib/features";

const SHOW_AFTER_PX = 600;

/**
 * Floating back-to-top button — appears after the user scrolls past the fold.
 * Sits on the `end` side like the help bubble, offset inward (end-20) so the
 * two buttons never overlap. Gated by the `backToTop` theme feature.
 */
export function BackToTop() {
  const t = useTranslations("store");
  const { on } = useStoreFeatures();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!on("backToTop")) return null;

  return (
    <button
      type="button"
      aria-label={t("backToTop")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "bg-background text-foreground fixed bottom-5 end-20 z-30 flex size-11 items-center justify-center rounded-full border shadow-lg transition-all hover:bg-accent",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
