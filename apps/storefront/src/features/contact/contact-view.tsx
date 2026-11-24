"use client";

import * as React from "react";
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateConversation } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useStore } from "@/lib/store-product";

/** Working hours label — the Store contract has no hours field, so this is copy. */
const PHONE_RE = /^(?:\+?966|0)?5\d{8}$/;

export function ContactView() {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const { data: store } = useStore();
  const create = useCreateConversation();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [orderNumber, setOrderNumber] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<{ phone?: string; message?: string }>({});
  const [done, setDone] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const normalized = phone.replace(/[\s-]/g, "");
    if (!PHONE_RE.test(normalized)) errs.phone = t("errors.phone");
    if (!message.trim()) errs.message = t("errors.required");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    create.mutate(
      [{ name, phone: normalized.startsWith("0") ? `+966${normalized.slice(1)}` : normalized, message, orderId: null }],
      {
        onSuccess: (c) => setDone(c.id),
        onError: () => mt.error("common.server.error"),
      },
    );
  };

  const waLink = store?.whatsappNumber ? `https://wa.me/${store.whatsappNumber.replace(/\D/g, "")}` : null;
  const address = store?.nationalAddress;

  if (done)
    return (
      <div className="container max-w-lg py-16 text-center">
        <CheckCircle2 className="text-success mx-auto size-16" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("contact.sentTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("contact.sentText")}</p>
        <p className="text-muted-foreground num mt-1 text-xs">{t("contact.reference", { id: done })}</p>
        <Button variant="outline" className="mt-6" onClick={() => { setDone(null); setMessage(""); }}>
          {t("contact.sendAnother")}
        </Button>
      </div>
    );

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      <Breadcrumbs items={[{ label: t("contact.title") }]} />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("contact.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("contact.subtitle")}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {store?.contactPhone ? (
            <InfoRow icon={Phone} label={t("contact.phone")} value={store.contactPhone} href={`tel:${store.contactPhone}`} ltr />
          ) : null}
          {store?.contactEmail ? <InfoRow icon={Mail} label={t("contact.email")} value={store.contactEmail} href={`mailto:${store.contactEmail}`} ltr /> : null}
          {waLink ? (
            <InfoRow icon={MessageCircle} label={t("contact.whatsapp")} value={t("contact.whatsappCta")} href={waLink} external />
          ) : null}
          {address ? (
            <InfoRow icon={MapPin} label={t("contact.address")} value={`${address.district ?? ""}، ${address.city} ${address.postalCode ?? ""}`} />
          ) : null}
          <InfoRow icon={Clock} label={t("contact.hours")} value={t("contact.hoursValue")} />
          <p className="text-muted-foreground text-xs leading-relaxed">{t("contact.responseTime")}</p>
        </div>
        <Card className="h-fit lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">{t("contact.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cf-name">{t("fullName")}</Label>
                  <Input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cf-phone">{t("phone")}</Label>
                  <Input id="cf-phone" dir="ltr" inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((s) => ({ ...s, phone: undefined })); }} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "cf-phone-err" : undefined} />
                  {errors.phone ? (
                    <p id="cf-phone-err" className="text-destructive text-xs" role="alert">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-order">{t("contact.orderNumber")}</Label>
                <Input id="cf-order" dir="ltr" inputMode="numeric" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ""))} placeholder={t("contact.orderNumberHint")} />
                {orderNumber ? <p className="text-muted-foreground num text-xs">{t("contact.orderLinked", { number: formatNumber(Number(orderNumber)) })}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-msg">{t("contact.message")}</Label>
                <Textarea id="cf-msg" rows={5} value={message} onChange={(e) => { setMessage(e.target.value); setErrors((s) => ({ ...s, message: undefined })); }} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "cf-msg-err" : undefined} />
                {errors.message ? (
                  <p id="cf-msg-err" className="text-destructive text-xs" role="alert">
                    {errors.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" size="lg" className="w-full" loading={create.isPending}>
                {t("contact.send")}
              </Button>
              <p className="text-muted-foreground text-center text-xs">{t("contact.honestNote")}</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href, external, ltr }: { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean; ltr?: boolean }) {
  const inner = (
    <span className="flex items-center gap-3">
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-4" aria-hidden />
      </span>
      <span>
        <span className="text-muted-foreground block text-xs">{label}</span>
        <span className="num text-sm font-medium" dir={ltr ? "ltr" : undefined}>
          {value}
        </span>
      </span>
    </span>
  );
  return href ? (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block rounded-xl border p-4 transition-colors hover:border-primary/40" onClick={undefined}>
      {inner}
    </a>
  ) : (
    <div className="rounded-xl border p-4">{inner}</div>
  );
}
