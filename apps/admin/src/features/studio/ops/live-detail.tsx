"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Headphones,
  Radio,
  SendHorizontal,
  Undo2,
  UserRoundCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTakeOverSession } from "@repo/api-client";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { useCan } from "@/lib/permissions";
import { channelIcons } from "../agent-meta";
import { AgentPath } from "../lab/agent-path";
import type { TreeIndex } from "../tree";
import { clock, TranscriptBubbles, Waveform } from "./shared";
import { ConfirmDialog } from "../detail/shared";
import { SentimentIcon, stateTone, type View } from "./live-session-card";

export function Detail({
  v,
  index,
  onBack,
  onSend,
  onRelease,
  newIds,
}: {
  v: View;
  index: TreeIndex;
  onBack: () => void;
  onSend: (text: string) => void;
  onRelease: () => void;
  newIds: Set<string>;
}) {
  const mt = useMsgToast();
  const t = useTranslations("studio.live");
  const canReply = useCan("conversations.reply");
  const takeOver = useTakeOverSession();
  const [listening, setListening] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [text, setText] = React.useState("");
  const s = v.session;
  const Icon = channelIcons[s.channel];
  const scroller = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [v.lines.length]);
  React.useEffect(() => setListening(false), [s.id]);
  const mood = s.sentiment < -0.3 ? "upset" : s.sentiment < 0.3 ? "neutral" : "happy";
  return (
    <Card className="flex h-[680px] flex-col overflow-hidden">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={onBack}
            aria-label={t("back")}
          >
            <ArrowRight className="ltr:rotate-180" aria-hidden />
          </Button>
          <span className="bg-muted flex size-10 items-center justify-center rounded-full">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{s.customerName}</p>
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="num" dir="ltr">
                {s.customerPhone}
              </span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    "size-1.5 animate-pulse rounded-full",
                    v.takenOver ? "bg-warning" : stateTone[s.state],
                  )}
                  aria-hidden
                />
                {v.takenOver ? t("takenOver") : t(`states.${s.state}`)}
              </span>
            </p>
          </div>
          <span className="num bg-muted rounded-md px-2 py-1 font-mono text-sm">
            {clock(v.duration)}
          </span>
        </div>
        <AgentPath path={v.path} index={index} animate={false} size="sm" />
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-2">
            <SentimentIcon value={s.sentiment} className="size-5" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[11px]">{t("sentiment")}</p>
              <p className="text-sm font-medium">{t(`moods.${mood}`)}</p>
            </div>
            <div className="bg-muted h-1.5 w-14 overflow-hidden rounded-full" aria-hidden>
              <div
                className={cn(
                  "h-full rounded-full",
                  mood === "upset"
                    ? "bg-destructive"
                    : mood === "neutral"
                      ? "bg-warning"
                      : "bg-success",
                )}
                style={{ width: `${((s.sentiment + 1) / 2) * 100}%` }}
              />
            </div>
          </div>
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-2">
            <Radio className="text-muted-foreground size-5" aria-hidden />
            <div>
              <p className="text-muted-foreground text-[11px]">{t("messages")}</p>
              <p className="num text-sm font-medium">{v.lines.length}</p>
            </div>
          </div>
        </div>
        {s.stuck && !v.takenOver ? (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle aria-hidden />
            <AlertDescription className="text-xs">{t("stuckHint")}</AlertDescription>
          </Alert>
        ) : null}
        {listening ? (
          <div className="bg-primary/5 text-primary flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium">
            <Headphones className="size-4" aria-hidden /> {t("listeningNow")}
            <Waveform active bars={28} className="h-6 flex-1" />
          </div>
        ) : null}
      </div>
      <div ref={scroller} className="flex-1 overflow-y-auto p-4" aria-live="polite">
        <TranscriptBubbles lines={v.lines} index={index} newIds={newIds} />
        {!v.takenOver && s.state !== "waiting" ? (
          <p className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-current"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
            {s.state === "transferring" ? t("transferring") : t("agentTyping")}
          </p>
        ) : null}
      </div>
      <div className="border-t p-3">
        {v.takenOver ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onSend(text.trim());
              setText("");
            }}
          >
            <Button type="button" variant="ghost" size="sm" onClick={onRelease}>
              <Undo2 aria-hidden /> <span className="hidden sm:inline">{t("release")}</span>
            </Button>
            <Input
              dir="auto"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={s.channel === "voice" ? t("sayPlaceholder") : t("replyPlaceholder")}
              aria-label={t("replyPlaceholder")}
            />
            <Button type="submit" size="icon" disabled={!text.trim()} aria-label={t("send")}>
              <SendHorizontal className="rtl:-scale-x-100" aria-hidden />
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {s.channel === "voice" ? (
              <Button
                variant={listening ? "secondary" : "outline"}
                onClick={() => setListening((l) => !l)}
                aria-pressed={listening}
              >
                <Headphones aria-hidden /> {listening ? t("stopListening") : t("listen")}
              </Button>
            ) : null}
            {canReply ? (
              <Button className="ms-auto" onClick={() => setConfirm(true)}>
                <UserRoundCheck aria-hidden /> {t("takeOver")}
              </Button>
            ) : (
              <p className="text-muted-foreground ms-auto text-xs">{t("noReply")}</p>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("takeOverTitle", { name: s.customerName })}
        description={s.channel === "voice" ? t("takeOverVoice") : t("takeOverChat")}
        confirmLabel={t("takeOver")}
        onConfirm={() =>
          takeOver.mutate([s.id], { onSuccess: () => mt.success("agents.live.takeover") })
        }
      />
    </Card>
  );
}
