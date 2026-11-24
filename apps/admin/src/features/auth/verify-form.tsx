"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AuthShell } from "./auth-shell";

const OTP_LENGTH = 6;

/** Code entry after signup (spec §5 auth flow) → then store setup. */
export function VerifyForm() {
  const t = useTranslations("signup");
  const mt = useMsgToast();
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(45);
  React.useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    await new Promise((r) => setTimeout(r, 700));
    router.push("/signup/store");
  };

  const resend = () => {
    setCountdown(45);
    mt.success("auth.otp.resent");
  };

  return (
    <AuthShell title={t("verify.title")} subtitle={t("verify.subtitle")}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="otp">{t("verify.code")}</Label>
          <Input
            id="otp"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            className="num text-center text-lg tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
          />
        </div>
        <Button type="submit" className="w-full" loading={pending} disabled={code.length !== OTP_LENGTH}>
          {t("verify.submit")}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          {countdown > 0 ? (
            mt.text("auth.otp.resend.countdown", { seconds: countdown })
          ) : (
            <button type="button" className="text-primary font-medium hover:underline" onClick={resend}>
              {t("verify.resend")}
            </button>
          )}
        </p>
      </form>
    </AuthShell>
  );
}
