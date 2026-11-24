"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { NOW, useConversationList, useRecoveryTemplates, useSendCartRecovery } from "@repo/api-client";
import type { AbandonedCart, Conversation } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";

/* Recovery-probability heuristic (§5.6) — deliberately simple and documented:
 * base 15% + intent signals. Opened a recovery message is the strongest signal
 * (+35%); having a registered customer profile +10%; a fresh abandonment
 * (<24h) +15%; social/engaged traffic sources +5%; each extra attempt beyond
 * the first without an open −10%. Clamped to [5, 90]. */
export function recoveryProbability(cart: AbandonedCart): number {
  let p = 15;
  if (cart.recoveryAttempts.some((a) => a.opened)) p += 35;
  else if (cart.recoveryAttempts.length) p += 10;
  if (cart.customerId) p += 10;
  if (Date.parse(cart.abandonedAt) > NOW - 86_400_000) p += 15;
  if (cart.source === "whatsapp" || cart.source === "instagram") p += 5;
  p -= Math.max(0, cart.recoveryAttempts.length - 1) * (cart.recoveryAttempts.some((a) => a.opened) ? 0 : 10);
  return Math.max(5, Math.min(90, Math.round(p)));
}

export function useCartConversation() {
  const conversations = useConversationList();
  return React.useCallback(
    (c: AbandonedCart): Conversation | undefined =>
      conversations.data?.find((x) => x.channel === "whatsapp" && ((c.customerId && x.customerId === c.customerId) || x.contact.phone === c.phone)),
    [conversations.data],
  );
}

export function CustomerCell({ cart, names }: { cart: AbandonedCart; names: Map<string, string> }) {
  return cart.customerId && names.has(cart.customerId) ? (
    <div className="min-w-0">
      <EntityLink type="customer" id={cart.customerId} className="block truncate" />
      <bdi className="num text-muted-foreground block text-xs" dir="ltr">{cart.phone}</bdi>
    </div>
  ) : (
    <bdi className="num" dir="ltr">{cart.phone}</bdi>
  );
}

/* Send-recovery dialog (§5.6): pick a template (or ad-hoc), optionally override
 * the message text, then send. Server-side gates: due-window, exclusion rules,
 * resend dedupe. */
export function SendButton({ cart, size = "sm" }: { cart: AbandonedCart; size?: "sm" | "default" }) {
  const t = useTranslations("sales.carts");
  const { locale } = useAppLocale();
  const send = useSendCartRecovery();
  const templates = useRecoveryTemplates();
  const canManage = useCan("marketing.manage");
  const [open, setOpen] = React.useState(false);
  const [templateId, setTemplateId] = React.useState<string>("none");
  const [message, setMessage] = React.useState("");
  const enabled = (templates.data ?? []).filter((x) => x.enabled);
  const template = enabled.find((x) => x.id === templateId);
  if (!canManage || cart.recoveryStatus === "recovered" || cart.recoveryStatus === "lost") return null;
  const submit = () => {
    send.mutate([cart.id, { templateId: template?.id ?? null, message: message.trim() || undefined }], {
      onSuccess: () => { toast.success(t("sent")); setOpen(false); },
      onError: (err) => {
        const code = (err as Error).message;
        toast.error(t.has(`errors.${code}` as never) ? t(`errors.${code}` as never) : t("sendFailed"));
      },
    });
  };
  return (
    <>
      <Button size={size} variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <Send aria-hidden />{t("send")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sendDialog.title")}</DialogTitle>
            <DialogDescription>{t("sendDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("sendDialog.template")}</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder={t("sendDialog.noTemplate")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("sendDialog.noTemplate")}</SelectItem>
                  {enabled.map((x) => <SelectItem key={x.id} value={x.id}>{x.name[locale] ?? x.name.ar}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="send-msg">{t("sendDialog.message")}</Label>
              <Textarea id="send-msg" rows={4} dir="auto" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={template?.content[locale] ?? template?.content.ar ?? t("sendDialog.messagePlaceholder")} />
              {template && !message ? <p className="text-muted-foreground text-xs">{t("sendDialog.templateHint")}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("sendDialog.cancel")}</Button>
            <Button disabled={send.isPending} onClick={submit}><Send aria-hidden />{t("sendDialog.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
