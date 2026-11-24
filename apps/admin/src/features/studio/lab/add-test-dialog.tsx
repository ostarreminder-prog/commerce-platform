"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAddTest } from "@repo/api-client";
import type { Agent, AgentTestCase } from "@repo/contracts";
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
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/cn";
import { AgentPicker } from "../agent-picker";
import { CHANNELS, channelIcons } from "../agent-meta";

export type TestDraft = Omit<AgentTestCase, "id" | "lastResult">;

export function AddTestDialog({
  open,
  onOpenChange,
  agents,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  agents: Agent[];
  initial: Partial<TestDraft>;
}) {
  const t = useTranslations("studio.lab.tests");
  const tc = useTranslations("studio.channel");
  const add = useAddTest();
  const [form, setForm] = React.useState<TestDraft>({
    question: "",
    expected: "",
    expectedAgentId: "",
    channel: "whatsapp",
  });
  React.useEffect(() => {
    if (open)
      setForm({ question: "", expected: "", expectedAgentId: "", channel: "whatsapp", ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const valid = form.question.trim() && form.expected.trim() && form.expectedAgentId;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      
      <DialogContent className="sm:max-w-lg">
        
        <DialogHeader>
          
          <DialogTitle>{t("addTitle")}</DialogTitle>
          <DialogDescription>{t("addHint")}</DialogDescription>
        </DialogHeader>
        <form
          id="add-test"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            add.mutate([form], {
              onSuccess: () => {
                toast.success(t("added"));
                onOpenChange(false);
              },
            });
          }}
        >
          
          <div className="space-y-1.5">
            
            <Label htmlFor="tc-q">{t("question")}</Label>
            <Input
              id="tc-q"
              dir="auto"
              value={form.question}
              placeholder={t("questionPlaceholder")}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            
            <Label htmlFor="tc-agent">{t("expectedAgent")}</Label>
            <AgentPicker
              id="tc-agent"
              agents={agents}
              value={form.expectedAgentId || null}
              onChange={(id) => setForm({ ...form, expectedAgentId: id ?? "" })}
              placeholder={t("pickAgent")}
            />
          </div>
          <div className="space-y-1.5">
            
            <Label htmlFor="tc-e">{t("expected")}</Label>
            <Textarea
              id="tc-e"
              rows={2}
              dir="auto"
              value={form.expected}
              placeholder={t("expectedPlaceholder")}
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
            />
          </div>
          <fieldset className="space-y-1.5">
            
            <legend className="text-sm font-medium">{t("channel")}</legend>
            <div className="flex gap-2">
              
              {CHANNELS.map((c) => {
                const Icon = channelIcons[c];
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={form.channel === c}
                    onClick={() => setForm({ ...form, channel: c })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm",
                      form.channel === c
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "hover:bg-muted",
                    )}
                  >
                    
                    <Icon className="size-4" aria-hidden /> {tc(c)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </form>
        <DialogFooter>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            
            {t("cancel")}
          </Button>
          <Button type="submit" form="add-test" disabled={!valid} loading={add.isPending}>
            
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
