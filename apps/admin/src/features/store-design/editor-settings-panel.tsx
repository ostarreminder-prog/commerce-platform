"use client";

import { MousePointerClick } from "lucide-react";
import { GlobalsSettingsForm, SectionSettingsForm } from "@repo/storefront-sections/editor";
import { Card } from "@repo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { editorAiAssist } from "./ai-copy";
import { EditorQualityPanel } from "./editor-quality-panel";
import { EditorSuggestCard } from "./editor-suggest-card";
import type { EditorController } from "./use-editor-state";

/** Left panel: selected-section settings | global theme settings | design quality. */
export function EditorSettingsPanel({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const section = editor.selectedSection;

  return (
    <Card className="min-w-0">
      <Tabs defaultValue="section">
        <div className="border-b p-2">
          <TabsList className="w-full">
            <TabsTrigger value="section" className="flex-1">
              {t("editor.sectionSettings")}
            </TabsTrigger>
            <TabsTrigger value="globals" className="flex-1">
              {t("editor.globals")}
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex-1">
              {t("editor.quality.title")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="section" className="max-h-[70vh] overflow-y-auto p-4">
          {section ? (
            <>
              <SectionSettingsForm section={section} onChange={editor.updateSection} aiAssist={editorAiAssist} />
              <EditorSuggestCard editor={editor} section={section} />
            </>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center">
              <MousePointerClick className="size-6" aria-hidden />
              <p className="max-w-48 text-sm">{t("editor.selectSection")}</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="globals" className="max-h-[70vh] overflow-y-auto p-4">
          <GlobalsSettingsForm
            value={editor.draft.globals}
            onChange={editor.setGlobals}
            schemes={editor.draft.colorSchemes ?? []}
            onSchemesChange={editor.setColorSchemes}
            presets={editor.draft.presets ?? []}
            onApplyPreset={editor.applyPreset}
            features={editor.draft.features ?? {}}
            featureSettings={editor.draft.featureSettings ?? {}}
            onFeaturesChange={editor.setFeatures}
          />
        </TabsContent>
        <TabsContent value="quality" className="max-h-[70vh] overflow-y-auto p-4">
          <EditorQualityPanel editor={editor} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
