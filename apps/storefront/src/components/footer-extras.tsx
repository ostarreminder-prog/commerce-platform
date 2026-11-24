"use client";

import * as React from "react";
import { CheckCircle2, Instagram, Mail, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNewsletterSubscribe } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useStore } from "@/lib/store-product";

/* Compact X/TikTok/Snapchat glyphs — lucide ships Instagram only. */
const SOCIAL_ICONS: Record<string, string> = { instagram: "IG", x: "X", tiktok: "TT", snapchat: "SC" };

/**
 * Footer contact block + newsletter signup. Store contact fields come from
 * `settings.general`; the signup writes a real newsletter-subscriber row.
 */
export function FooterExtras() {
  const t = useTranslations("store");
  const { data: store } = useStore();
  const subscribe = useNewsletterSubscribe();
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [fail, setFail] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFail(false);
    subscribe.mutate({ contact: email.trim(), channel: "email" }, { onSuccess: () => { setDone(true); setEmail(""); }, onError: () => setFail(true) });
  };

  const socials = Object.entries(store?.socialLinks ?? {}).filter(([, url]) => Boolean(url));

  return (
    <div className="text-muted-foreground space-y-3 text-sm">
      {store?.contactPhone ? (
        <a href={`tel:${store.contactPhone}`} className="hover:text-foreground num flex items-center gap-2" dir="ltr">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          {store.contactPhone}
        </a>
      ) : null}
      {store?.contactEmail ? (
        <a href={`mailto:${store.contactEmail}`} className="hover:text-foreground num flex items-center gap-2" dir="ltr">
          <Mail className="size-3.5 shrink-0" aria-hidden />
          {store.contactEmail}
        </a>
      ) : null}
      {socials.length ? (
        <div className="flex gap-2 pt-1">
          {socials.map(([kind, url]) => (
            <a
              key={kind}
              href={url as string}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={kind}
              className="bg-background hover:bg-accent flex size-8 items-center justify-center rounded-lg border text-[11px] font-bold"
            >
              {kind === "instagram" ? <Instagram className="size-4" aria-hidden /> : SOCIAL_ICONS[kind] ?? kind}
            </a>
          ))}
        </div>
      ) : null}
      <form onSubmit={submit} className="space-y-2 pt-2">
        <p className="text-foreground text-sm font-semibold">{t("footer.newsletter")}</p>
        {done ? (
          <p className="text-success flex items-center gap-1.5 text-xs" role="status">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("footer.newsletterDone")}
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("footer.newsletterPlaceholder")} aria-label={t("footer.newsletterPlaceholder")} dir="ltr" className="num" />
              <Button type="submit" size="icon" variant="outline" loading={subscribe.isPending} aria-label={t("footer.subscribe")}>
                <Send className="size-4" aria-hidden />
              </Button>
            </div>
            {fail ? (
              <p className="text-destructive text-xs" role="alert">
                {t("footer.newsletterError")}
              </p>
            ) : null}
          </>
        )}
      </form>
      {store?.legalName ? <p className="text-xs">{store.legalName}</p> : null}
      {store?.vatNumber ? <p className="num text-xs">{t("footer.vatNumber", { number: store.vatNumber })}</p> : null}
      {store?.commercialRegistration ? <p className="num text-xs">{t("footer.crNumber", { number: store.commercialRegistration })}</p> : null}
      {store?.nationalAddress ? <p className="text-xs">{[store.nationalAddress.district, store.nationalAddress.city, store.nationalAddress.postalCode].filter(Boolean).join("، ")}</p> : null}
    </div>
  );
}
