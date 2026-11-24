"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Agent, AgentChannel, AgentStatus, AgentTestCase, PhoneNumber, WhatsAppNumber } from "@repo/contracts";
import { studio, type NewKnowledge } from "./studio";


export const studioKeys = {
  all: ["studio"] as const,
  summary: ["studio", "summary"] as const,
  agents: ["studio", "agents"] as const,
  agent: (id: string) => ["studio", "agents", id] as const,
  versions: (id: string) => ["studio", "versions", id] as const,
  knowledge: ["studio", "knowledge"] as const,
  voices: ["studio", "voices"] as const,
  performance: (id: string, channel: string, days: number) => ["studio", "performance", id, channel, days] as const,
  tests: ["studio", "tests"] as const,
  live: ["studio", "live"] as const,
  history: ["studio", "history"] as const,
  session: (id: string) => ["studio", "history", id] as const,
  phones: ["studio", "phones"] as const,
  whatsapp: ["studio", "whatsapp"] as const,
};

function useStudioMutation<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => fn(...args),
    onSuccess: () => client.invalidateQueries({ queryKey: studioKeys.all }),
  });
}

export const useStudioSummary = () => useQuery({ queryKey: studioKeys.summary, queryFn: studio.summary });
export const useAgents = () => useQuery({ queryKey: studioKeys.agents, queryFn: studio.list });
export const useAgent = (id: string) => useQuery({ queryKey: studioKeys.agent(id), queryFn: () => studio.get(id) });
export const useAgentVersions = (id: string) =>
  useQuery({ queryKey: studioKeys.versions(id), queryFn: () => studio.versions(id) });
export const useKnowledgeSources = () => useQuery({ queryKey: studioKeys.knowledge, queryFn: studio.knowledge });
export const useAgentVoices = () => useQuery({ queryKey: studioKeys.voices, queryFn: studio.voices });
export const useAgentPerformance = (id: string, channel: AgentChannel | "all", days: number) =>
  useQuery({ queryKey: studioKeys.performance(id, channel, days), queryFn: () => studio.performance(id, channel, days) });
export const useAgentTests = () => useQuery({ queryKey: studioKeys.tests, queryFn: studio.tests });
export const useLiveSessions = () => useQuery({ queryKey: studioKeys.live, queryFn: studio.live });
export const useSessionHistory = () => useQuery({ queryKey: studioKeys.history, queryFn: studio.history });
export const useSessionRecord = (id: string) => useQuery({ queryKey: studioKeys.session(id), queryFn: () => studio.session(id) });
export const usePhoneNumbers = () => useQuery({ queryKey: studioKeys.phones, queryFn: studio.phones });
export const useWhatsAppNumbers = () => useQuery({ queryKey: studioKeys.whatsapp, queryFn: studio.whatsappNumbers });

export const useSaveAgent = () => useStudioMutation((agent: Agent) => studio.save(agent));
export const useCreateAgent = () => useStudioMutation((parentId: string | null, name: string) => studio.create(parentId, name));
export const useMoveAgent = () => useStudioMutation((id: string, parentId: string | null) => studio.move(id, parentId));
export const useDuplicateBranch = () => useStudioMutation((id: string) => studio.duplicateBranch(id));
export const useSetAgentStatus = () =>
  useStudioMutation((id: string, status: AgentStatus, branch: boolean) => studio.setStatus(id, status, branch));
export const useDeleteAgent = () => useStudioMutation((id: string, mode: "reparent" | "cascade") => studio.remove(id, mode));
export const usePublishAgent = () => useStudioMutation((id: string, note: string) => studio.publish(id, note));
export const useRestoreVersion = () => useStudioMutation((id: string, version: number) => studio.restoreVersion(id, version));
export const useAddKnowledge = () =>
  useStudioMutation((agentId: string, source: NewKnowledge) => studio.addKnowledge(agentId, source));
export const useSimulateTurn = () => useMutation({ mutationFn: (text: string) => studio.simulate(text) });
export const useRunTest = () => useStudioMutation((id: string) => studio.runTest(id));
export const useAddTest = () =>
  useStudioMutation((test: Omit<AgentTestCase, "id" | "lastResult">) => studio.addTest(test));
export const useTakeOverSession = () => useStudioMutation((id: string) => studio.takeOver(id));
export const useAddPhone = () =>
  useStudioMutation((phone: Omit<PhoneNumber, "id" | "status" | "callsToday">) => studio.addPhone(phone));
export const useAddWhatsApp = () =>
  useStudioMutation((number: Pick<WhatsAppNumber, "number" | "displayName" | "agentId">) => studio.addWhatsApp(number));
export const useLinkNumber = () =>
  useStudioMutation((kind: "phone" | "whatsapp", id: string, agentId: string | null) => studio.linkNumber(kind, id, agentId));
