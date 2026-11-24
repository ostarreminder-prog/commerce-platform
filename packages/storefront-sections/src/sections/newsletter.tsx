"use client";

import { Mail } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { useLocalized } from "./helpers";

export function NewsletterSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const L = useLocalized(section.settings);

  return (
    <section className="sec-pad-lg">
      <div className="container">
        <div className="bg-primary text-primary-foreground mx-auto max-w-3xl rounded-3xl px-6 py-12 text-center md:px-12">
          <Mail className="mx-auto size-9 opacity-80" aria-hidden />
          {L("title") ? <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{L("title")}</h2> : null}
          {L("text") ? <p className="mx-auto mt-2 max-w-md text-sm opacity-85 md:text-base">{L("text")}</p> : null}
          <form className="mx-auto mt-6 flex max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="email"
              required
              placeholder={L("placeholder") || t("email")}
              aria-label={t("email")}
              className="bg-paper/15 text-paper placeholder:text-paper/60 border-transparent focus-visible:ring-paper/50 h-11 rounded-xl"
            />
            <button type="submit" className="bg-paper text-ink h-11 shrink-0 rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-90">
              {L("buttonLabel") || t("subscribe")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
