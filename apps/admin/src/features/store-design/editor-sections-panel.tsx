"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ClipboardPaste, Copy, CopyPlus, Eye, EyeOff, GripVertical, LayoutPanelTop, MoreVertical, Plus, Scissors, Trash2 } from "lucide-react";
import type { ThemeSection } from "@repo/contracts";
import { isSectionType, SECTION_REGISTRY } from "@repo/storefront-sections/editor";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Card } from "@repo/ui/components/card";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { PageExperiencePicker } from "./page-experience-picker";
import { SectionLibrary } from "./section-library";
import { TemplatePicker } from "./template-picker";
import { sectionsOfTemplate, type EditorController } from "./use-editor-state";

type T = (key: string) => string;

function sectionLabel(t: T, section: ThemeSection) {
  return isSectionType(section.type) ? t(`sectionType.${section.type}`) : section.type;
}

function SortableRow({
  section,
  selected,
  onSelect,
  onToggleHidden,
  onRemove,
  onCopy,
  onCut,
  onDuplicate,
  t,
}: {
  section: ThemeSection;
  selected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onRemove: () => void;
  onCopy: () => void;
  onCut: () => void;
  onDuplicate: () => void;
  t: T;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const Icon = isSectionType(section.type) ? SECTION_REGISTRY[section.type].icon : LayoutPanelTop;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-lg border p-1.5 pe-1",
        selected && "border-primary bg-accent",
        isDragging && "bg-card relative z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:bg-accent inline-flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md active:cursor-grabbing"
        aria-label={t("editor.reorder")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-start text-sm", section.hidden && "text-muted-foreground")}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{sectionLabel(t, section)}</span>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleHidden}
        aria-label={section.hidden ? t("editor.show") : t("editor.hide")}
      >
        {section.hidden ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("editor.more")}>
            <MoreVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onCopy}>
            <Copy aria-hidden />
            {t("editor.clipboard.copy")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCut}>
            <Scissors aria-hidden />
            {t("editor.clipboard.cut")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}>
            <CopyPlus aria-hidden />
            {t("editor.clipboard.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onRemove} destructive>
            <Trash2 aria-hidden />
            {t("editor.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** Right panel: page-template picker + sortable section list + add-section library. */
export function EditorSectionsPanel({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as T;
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const sections = sectionsOfTemplate(editor.draft, editor.selectedTemplate);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) editor.moveSection(String(e.active.id), String(e.over.id));
  };

  return (
    <Card className="min-w-0 space-y-4 p-4">
      <TemplatePicker editor={editor} />
      <PageExperiencePicker editor={editor} />
      <div className="space-y-2">
        <span className="text-sm font-medium">{t("editor.sections")}</span>
        {sections.length ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {sections.map((s) => (
                  <SortableRow
                    key={s.id}
                    section={s}
                    selected={editor.selectedSectionId === s.id}
                    onSelect={() => editor.selectSection(s.id)}
                    onToggleHidden={() => editor.toggleSectionHidden(s.id)}
                    onRemove={() => editor.removeSection(s.id)}
                    onCopy={() => editor.copySection(s.id)}
                    onCut={() => editor.cutSection(s.id)}
                    onDuplicate={() => editor.duplicateSection(s.id)}
                    t={t}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">{t("editor.emptySections")}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setLibraryOpen(true)}>
          <Plus aria-hidden />
          {t("editor.addSection")}
        </Button>
        {editor.hasClipboard ? (
          <Button variant="outline" onClick={editor.pasteSection} aria-label={t("editor.clipboard.paste")} title={t("editor.clipboard.paste")}>
            <ClipboardPaste aria-hidden />
          </Button>
        ) : null}
      </div>
      <SectionLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        template={editor.selectedTemplate}
        onPick={(type) => {
          editor.addSection(type);
          setLibraryOpen(false);
        }}
      />
    </Card>
  );
}
