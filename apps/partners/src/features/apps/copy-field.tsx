"use client";

import * as React from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/toaster";

export function CopyField({ id, label, value, secret }: { id: string; label: string; value: string; secret?: boolean }) {
  const t = useTranslations();
  const [shown, setShown] = React.useState(!secret);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={shown ? value : "•".repeat(32)} dir="ltr" className="bg-muted/40 font-mono text-sm" />
        {secret ? (
          <Button type="button" variant="outline" size="icon" onClick={() => setShown((s) => !s)} aria-label={shown ? t("editor.hide") : t("editor.reveal")}>
            {shown ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`${t("common.copy")} ${label}`}
          onClick={() => void navigator.clipboard.writeText(value).then(() => toast.success(t("common.copied")))}
        >
          <Copy aria-hidden />
        </Button>
      </div>
    </div>
  );
}
