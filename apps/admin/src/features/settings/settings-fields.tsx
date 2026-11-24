"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { CardFooter } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";

export function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}

export function SaveFooter({ onSave, pending }: { onSave?: () => void; pending?: boolean }) {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  return (
    <CardFooter className="justify-end border-t pt-4">
      <Button loading={pending} onClick={() => (onSave ? onSave() : mt.success("common.save.success"))}>
        {t("save")}
      </Button>
    </CardFooter>
  );
}
