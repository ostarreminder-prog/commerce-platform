"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAddPhone, useAddWhatsApp } from "@repo/api-client";
import type { Agent } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { AgentPicker } from "../agent-picker";

const PROVIDERS = ["STC", "Mobily", "Zain"] as const;

const phoneOk = (n: string) => /^(9200\d{5}|05\d{8}|01\d{8})$/.test(n.replace(/\s/g, ""));
const waOk = (n: string) => /^9665\d{8}$/.test(n.replace(/[\s+]/g, ""));

export function AddNumberDialog({
  kind,
  open,
  onOpenChange,
  agents,
}: {
  kind: "phone" | "whatsapp";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  agents: Agent[];
}) {
  const t = useTranslations("studio.channels.add");
  const addPhone = useAddPhone();
  const addWa = useAddWhatsApp();
  const [number, setNumber] = React.useState("");
  const [name, setName] = React.useState("");
  const [provider, setProvider] = React.useState<string>("STC");
  const [agentId, setAgentId] = React.useState<string | null>(
    agents.find((a) => !a.parentId)?.id ?? null,
  );
  const [touched, setTouched] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    setNumber("");
    setName("");
    setTouched(false);
  }, [open]);
  const valid = kind === "phone" ? phoneOk(number) : waOk(number) && name.trim().length > 1;
  const done = () => {
    toast.success(t("added"));
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{kind === "phone" ? t("phoneTitle") : t("waTitle")}</DialogTitle>
          <DialogDescription>{kind === "phone" ? t("phoneHint") : t("waHint")}</DialogDescription>
        </DialogHeader>
        <form
          id="add-number"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!valid) return;
            const clean = number.replace(/[\s+]/g, "");
            if (kind === "phone")
              addPhone.mutate([{ number: clean, provider, agentId }], { onSuccess: done });
            else
              addWa.mutate([{ number: clean, displayName: name.trim(), agentId }], {
                onSuccess: done,
              });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="num">{t("number")}</Label>
            <Input
              id="num"
              dir="ltr"
              inputMode="tel"
              className="num text-end"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={kind === "phone" ? "920000000" : "9665XXXXXXXX"}
              aria-invalid={touched && !valid}
            />
            {touched && !(kind === "phone" ? phoneOk(number) : waOk(number)) ? (
              <p className="text-destructive text-xs">
                {kind === "phone" ? t("phoneInvalid") : t("waInvalid")}
              </p>
            ) : null}
          </div>
          {kind === "phone" ? (
            <div className="space-y-1.5">
              <Label htmlFor="provider">{t("provider")}</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="display">{t("displayName")}</Label>
              <Input
                id="display"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("displayPlaceholder")}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="agent">{t("agent")}</Label>
            <AgentPicker
              id="agent"
              agents={agents}
              value={agentId}
              onChange={setAgentId}
              noneLabel={t("later")}
            />
          </div>
          <p className="text-muted-foreground bg-muted/50 rounded-lg p-3 text-xs">
            {kind === "phone" ? t("phoneNote") : t("waNote")}
          </p>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="add-number" loading={addPhone.isPending || addWa.isPending}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
