"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useConnectSocialChannel } from "@repo/api-client";
import type { SocialChannelKind } from "@repo/contracts";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";

/** Simulated OAuth connect — asks for the handle/page id, lands `pending` then
 * flips to `connected` (mirrors the imports job pattern). Honestly labelled. */
export function ConnectSocialDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: SocialChannelKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("studio.channels.social");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const connect = useConnectSocialChannel();
  const [handle, setHandle] = React.useState("");

  React.useEffect(() => {
    if (open) setHandle("");
  }, [open]);

  const submit = () =>
    connect.mutate([kind, handle], {
      onSuccess: () => {
        mt.success("channels.social.connectStarted", { channel: t(`kinds.${kind}`) });
        onOpenChange(false);
      },
      onError: (e) => mt.error(e.message === "handle_required" ? "channels.social.handleRequired" : "common.save.error"),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("connectTitle", { channel: t(`kinds.${kind}`) })}</DialogTitle>
          <DialogDescription>{t("connectDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Banner variant="info">{t("simulatedNote", { channel: t(`kinds.${kind}`) })}</Banner>
          <div className="space-y-1.5">
            <Label htmlFor="social-handle">{t("handleLabel")}</Label>
            <Input
              id="social-handle"
              dir="ltr"
              placeholder={t("handlePlaceholder")}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("handleHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={submit} disabled={connect.isPending || !handle.trim()}>{t("connect")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
