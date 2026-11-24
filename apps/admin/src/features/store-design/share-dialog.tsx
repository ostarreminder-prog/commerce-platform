"use client";

import * as React from "react";
import { Copy, Link2, Trash2 } from "lucide-react";
import { useCreateThemeShare, useRevokeThemeShare, useThemeShares } from "@repo/api-client";
import type { Theme } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { formatDateTime } from "@repo/ui/lib/format";
import { PREVIEW_URL } from "./editor-messages";

const shareUrl = (token: string) => `${PREVIEW_URL}?share=${token}`;

/** "Share preview" dialog — creates a 7-day share token, lists active links, revokes them. */
export function ShareDialog({ theme, open, onOpenChange }: { theme: Theme; open: boolean; onOpenChange: (v: boolean) => void }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const mt = useMsgToast();
  const { data: shares = [] } = useThemeShares();
  const create = useCreateThemeShare();
  const revoke = useRevokeThemeShare();
  const mine = shares.filter((s) => s.themeId === theme.id);

  const copy = (token: string) => {
    const url = shareUrl(token);
    const done = () => mt.success("editor.share.copied");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done, done);
    } else {
      done();
    }
  };
  const createAndCopy = () =>
    create.mutate([theme.id], {
      onSuccess: (share) => copy(share.token),
      onError: () => mt.error("common.server.error"),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editor.share.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t("editor.share.hint")}</p>
        {mine.length ? (
          <ul className="space-y-2">
            {mine.map((s) => {
              const expired = +new Date(s.expiresAt) <= Date.now();
              return (
                <li key={s.id} className="flex items-center gap-2 rounded-lg border p-2">
                  <Link2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs" dir="ltr">
                      {shareUrl(s.token)}
                    </p>
                    <p className="text-muted-foreground num text-[11px]">
                      {expired ? t("editor.share.expired") : `${t("editor.share.expires")} ${formatDateTime(s.expiresAt, locale)}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => copy(s.token)} aria-label={t("editor.share.copy")}>
                    <Copy aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => revoke.mutate([s.token])}
                    aria-label={t("editor.share.revoke")}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">{t("editor.share.empty")}</p>
        )}
        <DialogFooter>
          <Button onClick={createAndCopy} disabled={create.isPending} loading={create.isPending}>
            <Link2 aria-hidden />
            {t("editor.share.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
