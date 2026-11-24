"use client";

import * as React from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { ImageField } from "@repo/ui/components/image-field";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useMediaAdapter } from "@repo/storefront-sections/editor";
import { isSectionType } from "@repo/storefront-sections/editor";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { generateSuggestions, orderSectionIds, type AiAudience, type AiSuggestion, type AiTone } from "./ai-copy";
import { sectionsOfTemplate, type EditorController } from "./use-editor-state";

const TONES: AiTone[] = ["luxury", "modern", "minimal", "playful"];
const AUDIENCES: AiAudience[] = ["general", "family", "youth", "premium"];
const GENERATE_MS = 1_500;

type T = (key: string) => string;

/** One suggestion card — swatches + resulting home-section order + apply button. */
function SuggestionCard({
  suggestion,
  editor,
  logo,
  onApplied,
  t,
}: {
  suggestion: AiSuggestion;
  editor: EditorController;
  /** Optional logo picked in the form — applied into globals. */
  logo: string;
  onApplied: () => void;
  t: T;
}) {
  const homeSections = sectionsOfTemplate(editor.draft, "home");
  const orderIds = orderSectionIds(suggestion.typeOrder, homeSections);
  const orderedTypes = orderIds.map((id) => homeSections.find((s) => s.id === id)?.type).filter(Boolean) as string[];

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{suggestion.nameAr}</p>
        <div className="flex gap-1">
          {suggestion.swatches.map((c) => (
            <span key={c} className="border-border size-5 rounded-full border" style={{ backgroundColor: c }} aria-hidden />
          ))}
        </div>
      </div>
      <ol className="text-muted-foreground flex flex-wrap gap-1 text-[11px]">
        {orderedTypes.map((type, i) => (
          <li key={`${type}-${i}`} className="bg-muted rounded px-1.5 py-0.5">
            {isSectionType(type) ? t(`sectionType.${type}`) : type}
          </li>
        ))}
      </ol>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => {
          editor.applyGenerated(
            { ...editor.draft.globals, ...suggestion.globals, ...(logo ? { logo } : {}) },
            { template: "home", sectionIds: orderIds },
          );
          onApplied();
        }}
      >
        {t("editor.ai.apply")}
      </Button>
    </div>
  );
}

/** "صمم لي بالـ AI" — UI-only generator: inputs → fake delay → 3 deterministic looks → apply as draft. */
export function AiDesignDialog({ editor, open, onOpenChange }: { editor: EditorController; open: boolean; onOpenChange: (v: boolean) => void }) {
  const strictT = useMsg();
  const t = strictT as unknown as T;
  const media = useMediaAdapter();
  const [logo, setLogo] = React.useState("");
  const [brief, setBrief] = React.useState("");
  const [tone, setTone] = React.useState<AiTone>("modern");
  const [audience, setAudience] = React.useState<AiAudience>("general");
  const [phase, setPhase] = React.useState<"form" | "loading" | "results">("form");
  const [suggestions, setSuggestions] = React.useState<AiSuggestion[]>([]);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const generate = () => {
    setPhase("loading");
    timerRef.current = window.setTimeout(() => {
      setSuggestions(generateSuggestions(tone, audience));
      setPhase("results");
    }, GENERATE_MS);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setPhase("form");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-5" aria-hidden />
            {t("editor.ai.title")}
          </DialogTitle>
        </DialogHeader>
        {phase === "results" ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{t("editor.ai.results")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} editor={editor} logo={logo} onApplied={() => onOpenChange(false)} t={t} />
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPhase("form")}>
                {t("editor.ai.back")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("editor.ai.logo")}</Label>
              {media ? (
                <ImageField
                  value={logo}
                  images={media.images}
                  uploading={media.uploading}
                  onSelect={(m) => setLogo(m.url)}
                  onUpload={
                    media.upload
                      ? (file) => {
                          void Promise.resolve(media.upload?.(file)).then((m) => {
                            if (m && typeof m === "object" && "url" in m) setLogo(m.url);
                          });
                        }
                      : undefined
                  }
                  onRemove={() => setLogo("")}
                />
              ) : (
                <Input dir="ltr" placeholder="https://…" value={logo} onChange={(e) => setLogo(e.target.value)} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-brief">{t("editor.ai.brief")}</Label>
              <Textarea id="ai-brief" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t("editor.ai.briefHint")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("editor.ai.tone")}</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as AiTone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((x) => (
                      <SelectItem key={x} value={x}>
                        {t(`editor.ai.tones.${x}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("editor.ai.audience")}</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as AiAudience)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((x) => (
                      <SelectItem key={x} value={x}>
                        {t(`editor.ai.audiences.${x}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={generate} disabled={phase === "loading"} className={cn(phase === "loading" && "opacity-80")}>
                {phase === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
                {phase === "loading" ? t("editor.ai.generating") : t("editor.ai.generate")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
