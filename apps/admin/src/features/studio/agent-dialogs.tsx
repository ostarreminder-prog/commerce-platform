"use client";

import * as React from "react";
import { useStoreRouter as useRouter } from "@/lib/store-route";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateAgent, useDeleteAgent, useSetAgentStatus } from "@repo/api-client";
import type { Agent } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AgentPicker } from "./agent-picker";
import { descendantIds, indexAgents } from "./tree";

export function AddAgentDialog({
  agents,
  parentId,
  open,
  onOpenChange,
}: {
  agents: Agent[];
  parentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mt = useMsgToast();
  const t = useTranslations("studio.add");
  const tc = useTranslations("common");
  const router = useRouter();
  const create = useCreateAgent();
  const [name, setName] = React.useState("");
  const [parent, setParent] = React.useState<string | null>(parentId);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setName("");
      setParent(parentId);
      setError(false);
    }
  }, [open, parentId]);
  const parentName = agents.find((a) => a.id === parentId)?.name;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(true);
    create.mutate([parent, name.trim()], {
      onSuccess: (agent) => {
        mt.success("agents.created", { name: agent.name });
        onOpenChange(false);
        router.push(`/agents/${agent.id}`);
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {parentName ? t("titleChild", { parent: parentName }) : t("title")}
            </DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="agent-name">{t("name")}</Label>
            <Input
              id="agent-name"
              value={name}
              placeholder={t("namePlaceholder")}
              aria-invalid={error}
              onChange={(e) => {
                setName(e.target.value);
                setError(false);
              }}
            />
            {error ? (
              <p className="text-destructive text-xs" role="alert">
                {t("nameRequired")}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-parent">{t("parent")}</Label>
            <AgentPicker
              id="agent-parent"
              agents={agents}
              value={parent}
              onChange={setParent}
              noneLabel={t("noParent")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAgentDialog({
  agents,
  agent,
  onClose,
}: {
  agents: Agent[];
  agent: Agent | null;
  onClose: () => void;
}) {
  const mt = useMsgToast();
  const t = useTranslations("studio.delete");
  const tc = useTranslations("common");
  const remove = useDeleteAgent();
  const [mode, setMode] = React.useState<"reparent" | "cascade">("reparent");
  React.useEffect(() => setMode("reparent"), [agent]);
  if (!agent) return null;
  const index = indexAgents(agents);
  const children = index.children.get(agent.id) ?? [];
  const all = descendantIds(index, agent.id);
  const parent = agent.parentId ? index.byId.get(agent.parentId) : undefined;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { name: agent.name })}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        {children.length ? (
          <div className="space-y-3">
            <Alert variant="warning">
              <AlertTriangle aria-hidden />
              <AlertDescription>{t("hasChildren", { count: all.length })}</AlertDescription>
            </Alert>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as typeof mode)}
              className="gap-2"
            >
              <Label className="hover:bg-muted/50 has-[:checked]:border-primary flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal">
                <RadioGroupItem value="reparent" />
                {parent
                  ? t("reparent", { parent: parent.name, count: children.length })
                  : t("reparentRoot", { count: children.length })}
              </Label>
              <Label className="hover:bg-muted/50 has-[:checked]:border-destructive flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal">
                <RadioGroupItem value="cascade" />
                <span className="text-destructive">{t("cascade", { count: all.length + 1 })}</span>
              </Label>
            </RadioGroup>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate([agent.id, mode], {
                onSuccess: () => {
                  mt.success("agents.delete.success");
                  onClose();
                },
              })
            }
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleAgentDialog({
  agents,
  agent,
  onClose,
}: {
  agents: Agent[];
  agent: Agent | null;
  onClose: () => void;
}) {
  const t = useTranslations("studio.pause");
  const tch = useTranslations("studio.channel");
  const tc = useTranslations("common");
  const setStatus = useSetAgentStatus();
  const [branch, setBranch] = React.useState(true);
  React.useEffect(() => setBranch(true), [agent]);
  if (!agent) return null;
  const all = descendantIds(indexAgents(agents), agent.id);
  const resuming = agent.status === "paused";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {resuming ? t("resumeTitle", { name: agent.name }) : t("title", { name: agent.name })}
          </DialogTitle>
          <DialogDescription>{resuming ? t("resumeBody") : t("body")}</DialogDescription>
        </DialogHeader>
        {!resuming && !agent.parentId ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertDescription>
              {t("rootWarning", { channels: agent.channels.map((c) => tch(c)).join("، ") })}
            </AlertDescription>
          </Alert>
        ) : null}
        {all.length ? (
          <Label className="flex items-center gap-3 rounded-lg border p-3 font-normal">
            <Checkbox checked={branch} onCheckedChange={(v) => setBranch(v === true)} />
            {resuming
              ? t("branchResume", { count: all.length })
              : t("branch", { count: all.length })}
          </Label>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            variant={resuming ? "default" : "destructive"}
            disabled={setStatus.isPending}
            onClick={() =>
              setStatus.mutate([agent.id, resuming ? "live" : "paused", branch && all.length > 0], {
                onSuccess: () => {
                  toast.success(resuming ? t("resumed") : t("paused"));
                  onClose();
                },
              })
            }
          >
            {resuming ? t("resumeConfirm") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
