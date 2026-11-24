"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { VoiceTab, WhatsAppTab } from "./detail/channel-tabs";
import { GeneralTab } from "./detail/general-tab";
import { HandoffsTab } from "./detail/handoffs-tab";
import { HoursTab } from "./detail/hours-tab";
import { KnowledgeTab } from "./detail/knowledge-tab";
import { PerformanceTab } from "./detail/performance-tab";
import { PersonaTab } from "./detail/persona-tab";
import type { TabProps } from "./detail/shared";
import { ToolsTab } from "./detail/tools-tab";
import { VersionsTab } from "./detail/versions-tab";
import type { AgentWarning } from "./tree";

export const TABS = [
  "general",
  "persona",
  "handoffs",
  "tools",
  "knowledge",
  "voice",
  "whatsapp",
  "hours",
  "versions",
  "performance",
] as const;
export type Tab = (typeof TABS)[number];

export function EditorTabs({
  tab,
  tabs,
  onTabChange,
  tabProps,
  warnings,
  dirty,
  readOnly,
  onAddChild,
}: {
  tab: Tab;
  tabs: Tab[];
  onTabChange: (next: string) => void;
  tabProps: TabProps;
  warnings: AgentWarning[];
  dirty: boolean;
  readOnly: boolean;
  onAddChild: () => void;
}) {
  const t = useTranslations("studio.detail");
  return (
    <Tabs value={tab} onValueChange={onTabChange}>
      <div className="bg-background/95 sticky top-14 z-20 -mx-4 border-b px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-16">
        <TabsList className="h-auto w-full justify-start bg-transparent p-0">
          {tabs.map((k) => (
            <TabsTrigger
              key={k}
              value={k}
              className="data-[state=active]:bg-muted data-[state=active]:shadow-none"
            >
              {t(`tabs.${k}`)}
              {k === "general" && warnings.length ? (
                <span className="bg-warning size-1.5 rounded-full" aria-hidden />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="pt-6">
        <TabsContent value="general" className="mt-0">
          <GeneralTab {...tabProps} warnings={warnings} onAddChild={onAddChild} />
        </TabsContent>
        <TabsContent value="persona" className="mt-0">
          <PersonaTab {...tabProps} />
        </TabsContent>
        <TabsContent value="handoffs" className="mt-0">
          <HandoffsTab {...tabProps} />
        </TabsContent>
        <TabsContent value="tools" className="mt-0">
          <ToolsTab {...tabProps} />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-0">
          <KnowledgeTab {...tabProps} />
        </TabsContent>
        <TabsContent value="voice" className="mt-0">
          <VoiceTab {...tabProps} />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-0">
          <WhatsAppTab {...tabProps} />
        </TabsContent>
        <TabsContent value="hours" className="mt-0">
          <HoursTab {...tabProps} />
        </TabsContent>
        <TabsContent value="versions" className="mt-0">
          <VersionsTab draft={tabProps.draft} readOnly={readOnly} dirty={dirty} />
        </TabsContent>
        <TabsContent value="performance" className="mt-0">
          <PerformanceTab draft={tabProps.draft} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
