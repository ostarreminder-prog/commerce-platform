"use client";

import * as React from "react";
import Link from "@/components/store-link";
import { useSearchParams } from "next/navigation";
import { BookmarkPlus, Target, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useSimulateTurn } from "@repo/api-client";
import type { AgentChannel, AgentTestCase } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Can } from "@/lib/permissions";
import { CHANNELS, channelIcons } from "../agent-meta";
import { StudioHeader } from "../studio-header";
import { indexAgents } from "../tree";
import { type ChatTurn, Simulator } from "./simulator";
import { AddTestDialog, type TestDraft, TestCases } from "./test-cases";
import { TraceTimeline } from "./trace-timeline";

const SUGGESTIONS = ["s1", "s2", "s3", "s4", "s5"] as const;
let seq = 0;
const nextId = () => `m${++seq}`;

export function TestLab() {
  const t = useTranslations("studio.lab");
  const tc = useTranslations("studio.channel");
  const params = useSearchParams();
  const agents = useAgents();
  const simulate = useSimulateTurn();
  const [channel, setChannel] = React.useState<AgentChannel>(
    (params.get("channel") as AgentChannel) || "whatsapp",
  );
  const [expected, setExpected] = React.useState<string | null>(params.get("agent"));
  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [lastText, setLastText] = React.useState("");
  const [saving, setSaving] = React.useState<Partial<TestDraft> | null>(null);
  const topRef = React.useRef<HTMLDivElement>(null);
  const index = React.useMemo(() => indexAgents(agents.data ?? []), [agents.data]);
  const selectedTurn = turns.find((x) => x.id === selected);
  const send = (text: string) => {
    setLastText(text);
    setTurns((list) => [
      ...list.filter((x) => x.from !== "error"),
      { id: nextId(), from: "customer", text, at: new Date() },
    ]);
    simulate.mutate(text, {
      onSuccess: (turn) => {
        const id = nextId();
        const agentId = turn.steps.at(-1)?.agentId ?? turn.path.at(-1);
        setTurns((list) => [
          ...list,
          { id, from: "agent", text: turn.reply, agentId, turn, at: new Date() },
        ]);
        setSelected(id);
      },
      onError: () =>
        setTurns((list) => [...list, { id: nextId(), from: "error", text: "", at: new Date() }]),
    });
  };
  const reset = () => {
    setTurns([]);
    setSelected(null);
  };
  const switchChannel = (c: string) => {
    setChannel(c as AgentChannel);
    reset();
  };
  const openTest = (test: AgentTestCase) => {
    setChannel(test.channel);
    setExpected(test.expectedAgentId);
    setTurns([]);
    setSelected(null);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    send(test.question);
  };
  const saveAsTest = () => {
    if (!selectedTurn?.turn) return;
    const i = turns.indexOf(selectedTurn);
    const question =
      [...turns.slice(0, i)].reverse().find((x) => x.from === "customer")?.text ?? "";
    setSaving({
      question,
      expected: selectedTurn.text,
      expectedAgentId: selectedTurn.turn.path.at(-1) ?? "",
      channel,
    });
  };
  return (
    <div className="space-y-6">
      <StudioHeader />
      <DataState
        state={agents}
        loading={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Skeleton className="h-[620px] rounded-2xl" />
            <Skeleton className="h-[620px] rounded-xl" />
          </div>
        }
      >
        {(list) => {
          const target = expected ? index.byId.get(expected) : undefined;
          return (
            <div className="space-y-6" ref={topRef}>
              <div className="flex flex-wrap items-center gap-3">
                <Tabs value={channel} onValueChange={switchChannel}>
                  <TabsList>
                    {CHANNELS.map((c) => {
                      const Icon = channelIcons[c];
                      return (
                        <TabsTrigger key={c} value={c}>
                          <Icon className="size-4" aria-hidden /> {tc(c)}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
                {target ? (
                  <div className="bg-primary/5 border-primary/20 flex min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                    <Target className="text-primary size-4 shrink-0" aria-hidden />
                    <span className="truncate">
                      {t("target")}
                      <Link href={`/agents/${target.id}`} className="font-semibold hover:underline">
                        {target.name}
                      </Link>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpected(null)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("clearTarget")}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t("hint")}</p>
                )}
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="mx-auto w-full max-w-xl lg:max-w-none">
                  <Simulator
                    channel={channel}
                    turns={turns}
                    pending={simulate.isPending}
                    index={index}
                    selected={selected}
                    onSelect={setSelected}
                    onSend={send}
                    onRetry={() => lastText && send(lastText)}
                    onReset={reset}
                    suggestions={SUGGESTIONS.map((k) => t(`suggestions.${k}`))}
                  />
                </div>
                <Card className="flex max-h-[620px] flex-col overflow-hidden">
                  <div className="flex items-center gap-2 border-b px-4 py-3">
                    <div className="flex-1">
                      <p className="font-semibold">{t("traceTitle")}</p>
                      <p className="text-muted-foreground text-xs">{t("traceHint")}</p>
                    </div>
                    {selectedTurn?.turn ? (
                      <Can permission="agents.manage">
                        <Button size="sm" variant="outline" onClick={saveAsTest}>
                          <BookmarkPlus aria-hidden /> {t("saveAsTest")}
                        </Button>
                      </Can>
                    ) : null}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <TraceTimeline
                      turn={selectedTurn?.turn ?? null}
                      index={index}
                      expected={expected}
                    />
                  </div>
                </Card>
              </div>
              <TestCases index={index} agents={list} onOpen={openTest} />
              <AddTestDialog
                open={saving !== null}
                onOpenChange={(o) => !o && setSaving(null)}
                agents={list}
                initial={saving ?? {}}
              />
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
