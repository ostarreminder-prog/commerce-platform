"use client";

import * as React from "react";
import { KeyRound, Languages, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser, useMe, useUpdateProfile, useChangePassword } from "@repo/api-client";
import { DEFAULT_ROLES } from "@repo/contracts";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";

/** `/settings/profile` — the signed-in merchant's own account (spec §5.2). */
export function ProfilePanel() {
  const t = useTranslations("settings.profile");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const me = useMe();
  const session = useCurrentUser();
  const update = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [language, setLanguage] = React.useState<"ar" | "en">("ar");
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  React.useEffect(() => {
    if (!me.data) return;
    setName(me.data.name);
    setPhone(me.data.phone ?? "");
    setLanguage(me.data.preferredLanguage ?? "ar");
    /* Hydrate once per fetch — edits stay local until saved. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data?.id]);

  if (me.isPending) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-56" /></div>;
  const staff = me.data;
  if (!staff) return null;
  const role = session.data?.role ?? null;
  const looseT = t as unknown as (key: string) => string;
  const roleLabel = role ? (role.id.replace(/^role_/, "") in DEFAULT_ROLES ? looseT(`roles.${role.id.replace(/^role_/, "")}`) : role.name) : "—";
  const initials = staff.name.split(" ").map((p) => p.charAt(0)).slice(0, 2).join(" ");

  const saveProfile = () => {
    if (!name.trim()) { toast.error(t("nameRequired")); return; }
    update.mutate([{ name: name.trim(), phone: phone.trim() || null, preferredLanguage: language }], {
      onSuccess: () => mt.success("profile.saved"),
      onError: () => mt.error("common.save.error"),
    });
  };

  const savePassword = () => {
    if (next !== confirm) { toast.error(t("password.mismatch")); return; }
    changePassword.mutate([{ current, next }], {
      onSuccess: () => { mt.success("profile.passwordSaved"); setCurrent(""); setNext(""); setConfirm(""); },
      onError: (e) => toast.error(e.message === "weak" ? t("password.weak") : e.message === "current_required" ? t("password.currentRequired") : t("password.weak")),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserCircle2 className="size-4" aria-hidden /> {t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{staff.name}</p>
              <p className="text-muted-foreground text-sm" dir="ltr">{staff.email}</p>
              <p className="text-muted-foreground text-xs">{t("role", { role: roleLabel })}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">{t("name")}</Label>
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-phone">{t("phone")}</Label>
              <Input id="pf-phone" dir="ltr" className="num" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-email">{t("email")}</Label>
              <Input id="pf-email" dir="ltr" value={staff.email} disabled />
              <p className="text-muted-foreground text-xs">{t("emailHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-lang">{t("language")}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "ar" | "en")}>
                <SelectTrigger id="pf-lang"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t("langAr")}</SelectItem>
                  <SelectItem value="en">{t("langEn")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground flex items-center gap-1 text-xs"><Languages className="size-3" aria-hidden /> {t("languageHint")}</p>
            </div>
          </div>
          <Button onClick={saveProfile} disabled={update.isPending}><Save aria-hidden /> {tc("save")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="size-4" aria-hidden /> {t("password.title")}</CardTitle>
          <CardDescription>{t("password.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Banner variant="info">{t("password.simulated")}</Banner>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-cur">{t("password.current")}</Label>
              <Input id="pf-cur" type="password" dir="ltr" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-new">{t("password.next")}</Label>
              <Input id="pf-new" type="password" dir="ltr" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-confirm">{t("password.confirm")}</Label>
              <Input id="pf-confirm" type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <Button variant="outline" onClick={savePassword} disabled={changePassword.isPending || !current || !next}>{t("password.submit")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" aria-hidden /> {t("session.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">{t("session.lastLogin")}</dt><dd className="num mt-0.5">{staff.lastLoginAt ? formatDateTime(staff.lastLoginAt, locale) : "—"}</dd></div>
            <div><dt className="text-muted-foreground">{t("session.mfa")}</dt><dd className="mt-0.5">{staff.mfaEnabled ? t("session.mfaOn") : t("session.mfaOff")}</dd></div>
            <div><dt className="text-muted-foreground">{t("session.status")}</dt><dd className="mt-0.5">{t(`session.statuses.${staff.status}`)}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
