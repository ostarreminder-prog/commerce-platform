"use client";

import * as React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { SectionHeading, boolSetting, strSetting, useLocalized } from "./helpers";

/**
 * Contact form — field toggles + required flags drive which inputs render.
 * No backend: submit resets the form and shows the shared success toast.
 * `layout: "split"` shows the address/phone/email info column beside the form.
 */
export function ContactFormSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const mt = useMsgToast();
  const s = section.settings;
  const L = useLocalized(s);

  const split = strSetting(s, "layout", "center") === "split";
  const fields = (
    [
      { key: "name", show: boolSetting(s, "showName", true), req: boolSetting(s, "reqName", true), type: "text", label: t("name") },
      { key: "email", show: boolSetting(s, "showEmail", true), req: boolSetting(s, "reqEmail", true), type: "email", label: t("email") },
      { key: "phone", show: boolSetting(s, "showPhone"), req: boolSetting(s, "reqPhone"), type: "tel", label: t("phone") },
      { key: "subject", show: boolSetting(s, "showSubject", true), req: boolSetting(s, "reqSubject"), type: "text", label: t("subject") },
      { key: "message", show: boolSetting(s, "showMessage", true), req: boolSetting(s, "reqMessage", true), type: "text", label: t("message"), area: true },
    ] as const
  ).filter((f) => f.show);

  const info = [
    { icon: MapPin, text: L("address") },
    { icon: Phone, text: strSetting(s, "phone") },
    { icon: Mail, text: strSetting(s, "email") },
  ].filter((i) => i.text);
  const splitView = split && info.length > 0;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.currentTarget.reset();
    mt.success("sections.formSent");
  };

  const form = (
    <form className={splitView ? "space-y-4" : "mx-auto max-w-xl space-y-4"} onSubmit={submit}>
      {fields.map((f) =>
        "area" in f && f.area ? (
          <Textarea key={f.key} name={f.key} required={f.req} placeholder={f.label} aria-label={f.label} className="rounded-xl" />
        ) : (
          <Input key={f.key} name={f.key} type={f.type} required={f.req} placeholder={f.label} aria-label={f.label} className="h-11 rounded-xl" />
        ),
      )}
      <button
        type="submit"
        className="bg-primary text-primary-foreground h-11 rounded-xl px-6 text-sm font-semibold transition-opacity hover:opacity-90"
      >
        {L("buttonLabel") || t("send")}
      </button>
    </form>
  );

  return (
    <section className="sec-pad-lg">
      <div className="container">
        <SectionHeading title={L("title")} subtitle={L("text")} />
        {splitView ? (
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div className="space-y-4">
              {info.map((i) => (
                <div key={i.text} className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <i.icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm">{i.text}</span>
                </div>
              ))}
            </div>
            {form}
          </div>
        ) : (
          form
        )}
      </div>
    </section>
  );
}
