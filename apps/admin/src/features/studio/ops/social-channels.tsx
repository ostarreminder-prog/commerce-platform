"use client";

import * as React from "react";
import { AtSign, Facebook, FlaskConical, Instagram, Mail, Music2, Plug, Twitter, Unplug, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useChannelSettings, useDisconnectSocialChannel, useSetSocialChannelAgent } from "@repo/api-client";
import type { Agent, SocialChannelConnection, SocialChannelKind } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Can } from "@/lib/permissions";
import { ConnectSocialDialog } from "./connect-social-dialog";
import { LinkedAgent, Status } from "./channel-shared";

export const SOCIAL_ICONS: Record<SocialChannelKind, LucideIcon> = {
  instagram: Instagram,
  messenger: Facebook,
  x: Twitter,
  tiktok: Music2,
  email: Mail,
};

const KINDS: SocialChannelKind[] = ["instagram", "messenger", "x", "tiktok", "email"];

const blank = (kind: SocialChannelKind): SocialChannelConnection => ({
  id: `none_${kind}`, kind, handle: "", status: "disconnected", agentId: null, connectedAt: null,
});

/** `/agents/channels` social section — Instagram DM / Messenger / X / TikTok
 * connections with simulated OAuth, agent assignment and a test action. */
export function SocialChannels({ agents }: { agents: Agent[] }) {
  const t = useTranslations("studio.channels.social");
  const mt = useMsgToast();
  const settings = useChannelSettings();
  const disconnect = useDisconnectSocialChannel();
  const setAgent = useSetSocialChannelAgent();
  const [connecting, setConnecting] = React.useState<SocialChannelKind | null>(null);
  const [removing, setRemoving] = React.useState<SocialChannelConnection | null>(null);

  const of = (kind: SocialChannelKind) => settings.data?.social.find((s) => s.kind === kind) ?? blank(kind);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 font-semibold">
          <AtSign className="size-4" aria-hidden /> {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("hint")}</p>
      </div>
      <DataState
        state={settings}
        isEmpty={(d) => !d}
        loading={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        }
      >
        {() => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {KINDS.map((kind) => {
              const conn = of(kind);
              const Icon = SOCIAL_ICONS[kind];
              const connected = conn.status === "connected";
              return (
                <Card key={kind}>
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{t(`kinds.${kind}`)}</p>
                        <p className="text-muted-foreground truncate text-sm" dir="ltr">
                          {conn.handle ? conn.handle : t("notConnected")}
                        </p>
                      </div>
                      <Status value={conn.status} />
                    </div>
                    <div className="mt-auto space-y-2 border-t pt-3">
                      <p className="text-muted-foreground text-xs">{t("agent")}</p>
                      <LinkedAgent
                        agents={agents}
                        value={conn.agentId}
                        onChange={(agentId) => conn.status !== "disconnected" && setAgent.mutate([conn.id, agentId])}
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Can permission="agents.manage">
                          {connected || conn.status === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!connected}
                                onClick={() => mt.info("channels.social.testSent", { channel: t(`kinds.${kind}`) })}
                              >
                                <FlaskConical aria-hidden /> {t("test")}
                              </Button>
                              <Button variant="ghost" size="sm" disabled={conn.status === "pending"} onClick={() => setRemoving(conn)}>
                                <Unplug aria-hidden /> {t("disconnect")}
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setConnecting(kind)}>
                              <Plug aria-hidden /> {t("connect")}
                            </Button>
                          )}
                        </Can>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DataState>
      <ConnectSocialDialog kind={connecting ?? "instagram"} open={connecting !== null} onOpenChange={(o) => !o && setConnecting(null)} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        titleKey="channels.social.disconnectTitle"
        bodyKey="channels.social.disconnectBody"
        params={removing ? { channel: t(`kinds.${removing.kind}`), handle: removing.handle } : undefined}
        confirmKey="channels.social.disconnectCta"
        danger
        pending={disconnect.isPending}
        onConfirm={() =>
          removing &&
          disconnect.mutate([removing.id], {
            onSuccess: () => { mt.success("channels.social.disconnected", { channel: t(`kinds.${removing.kind}`) }); setRemoving(null); },
            onError: () => mt.error("common.save.error"),
          })
        }
      />
    </div>
  );
}
