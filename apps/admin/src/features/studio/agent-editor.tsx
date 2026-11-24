"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useStoreRouter as useRouter, useStorePathname as usePathname } from "@/lib/store-route";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAgentVersions,
  usePhoneNumbers,
  usePublishAgent,
  useSaveAgent,
  useDuplicateBranch,
} from "@repo/api-client";
import type { Agent } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useCan } from "@/lib/permissions";
import type { AgentAction } from "./agent-actions";
import { AddAgentDialog, DeleteAgentDialog, ToggleAgentDialog } from "./agent-dialogs";
import { EditorFooter, EditorHeader } from "./editor-chrome";
import { EditorTabs, TABS, type Tab } from "./editor-tabs";
import { PublishDialog } from "./publish-dialog";
import { agentWarnings, ancestry, indexAgents } from "./tree";
import { ConfirmDialog, type Patch } from "./detail/shared";

export function Editor({ saved, agents }: { saved: Agent; agents: Agent[] }) {
  const mt = useMsgToast();
  const t = useTranslations("studio.detail");
  const ts = useTranslations("studio");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canManage = useCan("agents.manage");
  const readOnly = !canManage;
  const { data: phones = [] } = usePhoneNumbers();
  const { data: versions = [] } = useAgentVersions(saved.id);
  const save = useSaveAgent();
  const publish = usePublishAgent();
  const duplicate = useDuplicateBranch();
  const [draft, setDraft] = React.useState<Agent>(saved);
  const [baseline, setBaseline] = React.useState(saved);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Agent | null>(null);
  const [toggling, setToggling] = React.useState<Agent | null>(null); // Adopt server changes (publish, restore, status) when there is nothing local to lose.
  React.useEffect(() => {
    setBaseline((prev) => {
      if (prev === saved) return prev;
      setDraft((d) =>
        JSON.stringify(d) === JSON.stringify(prev)
          ? saved
          : { ...d, version: saved.version, status: saved.status },
      );
      return saved;
    });
  }, [saved]);
  const patch: Patch = React.useCallback((fn) => setDraft((d) => fn(d)), []);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const index = React.useMemo(
    () => indexAgents(agents.map((a) => (a.id === draft.id ? draft : a))),
    [agents, draft],
  );
  const path = ancestry(index, draft.id);
  const warnings = agentWarnings(index, draft, phones);
  const latest = versions[0];
  const unpublished =
    !dirty &&
    (draft.status === "draft" || (latest ? baseline.updatedAt > latest.publishedAt : true));
  const valid = draft.name.trim().length > 0 && draft.handoffRules.every((r) => r.condition.trim());
  const tabs = TABS.filter((tab) =>
    tab === "voice"
      ? draft.channels.includes("voice")
      : tab === "whatsapp"
        ? draft.channels.includes("whatsapp")
        : true,
  );
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested && tabs.includes(requested) ? requested : "general";
  const setTab = (next: string) => router.replace(`${pathname}?tab=${next}`, { scroll: false });
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const doSave = (then?: () => void) =>
    save.mutate([draft], {
      onSuccess: (next) => {
        setBaseline(next);
        setDraft(next);
        if (then) then();
        else mt.success("agents.saved");
      },
    });
  const doPublish = () => {
    const run = () =>
      publish.mutate([draft.id, note.trim() || t("defaultNote")], {
        onSuccess: (next) => {
          mt.success("agents.published", { version: next.version, name: draft.name });
          setPublishOpen(false);
          setNote("");
        },
      });
    if (dirty) doSave(run);
    else run();
  };
  const onAction = (action: AgentAction, agent: Agent) => {
    if (action === "addChild") setAdding(true);
    if (action === "delete") setDeleting(agent);
    if (action === "toggle") setToggling(agent);
    if (action === "duplicate")
      duplicate.mutate([agent.id], {
        onSuccess: (copy) => (
          toast.success(ts("actions.duplicated")),
          router.push(`/agents/${copy.id}`)
        ),
      });
  };
  const tabProps = { draft, patch, index, agents, readOnly };
  return (
    <div className="space-y-6 pb-28">
      <EditorHeader
        draft={draft}
        baseline={baseline}
        path={path}
        warnings={warnings}
        index={index}
        saved={saved}
        onAction={onAction}
      />
      {readOnly ? (
        <Alert variant="info">
          <Eye aria-hidden /> <AlertDescription>{t("readOnly")}</AlertDescription>
        </Alert>
      ) : null}
      <EditorTabs
        tab={tab}
        tabs={tabs}
        onTabChange={setTab}
        tabProps={tabProps}
        warnings={warnings}
        dirty={dirty}
        readOnly={readOnly}
        onAddChild={() => setAdding(true)}
      />
      {!readOnly ? (
        <EditorFooter
          draft={draft}
          dirty={dirty}
          unpublished={unpublished}
          valid={valid}
          saving={save.isPending && !publishOpen}
          onDiscard={() => setDiscardOpen(true)}
          onSave={() => doSave()}
          onPublish={() => setPublishOpen(true)}
        />
      ) : null}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        draft={draft}
        warnings={warnings}
        note={note}
        onNoteChange={setNote}
        onConfirm={doPublish}
      />
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t("discardTitle")}
        description={t("discardBody")}
        confirmLabel={t("footer.discard")}
        destructive
        onConfirm={() => setDraft(baseline)}
      />
      <AddAgentDialog agents={agents} parentId={draft.id} open={adding} onOpenChange={setAdding} />
      <DeleteAgentDialog agents={agents} agent={deleting} onClose={() => setDeleting(null)} />
      <ToggleAgentDialog agents={agents} agent={toggling} onClose={() => setToggling(null)} />
    </div>
  );
}
