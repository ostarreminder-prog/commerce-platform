"use client";

import { Link2, MessageCircle, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StoreProduct } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useStoreFeatures } from "@/lib/features";

/** Share dropdown — WhatsApp (wa.me), X intent, and copy-link (spec §8.12; X icon is text). */
export function ShareMenu({ product: p }: { product: StoreProduct }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { on } = useStoreFeatures();
  if (!on("share")) return null;

  const url = () => (typeof window === "undefined" ? "" : `${window.location.origin}/products/${p.id}`);
  const text = encodeURIComponent((p.name[locale] ?? p.name.ar));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyLink"));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("share")}>
          <Share2 aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`https://wa.me/?text=${text}%20${encodeURIComponent(url())}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {t("shareWhatsapp")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url())}`} target="_blank" rel="noopener noreferrer">
            <span className="text-xs font-bold" aria-hidden>
              X
            </span>
            {t("shareX")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copy}>
          <Link2 aria-hidden />
          {t("copyLink")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
