"use client";

import type { SectionType } from "@repo/storefront-sections/editor";
import { SECTION_REGISTRY, SECTION_TYPES } from "@repo/storefront-sections/editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { useMsg } from "@repo/ui/hooks/use-msg";

/** Chrome sections ship with every template — adding duplicates makes no sense. */
const CHROME_SECTIONS = new Set<SectionType>(["header", "footer"]);
/** `main-product` only renders a meaningful context on the product template. */
const PRODUCT_ONLY_SECTIONS = new Set<SectionType>(["main-product"]);

export interface SectionLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (type: SectionType) => void;
  /** Template being edited — filters sections that don't fit its context. */
  template?: string;
}

/** Section library dialog — pick a section type to append to the template. */
export function SectionLibrary({ open, onOpenChange, onPick, template }: SectionLibraryProps) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const types = SECTION_TYPES.filter(
    (type) => !CHROME_SECTIONS.has(type) && (!PRODUCT_ONLY_SECTIONS.has(type) || template === "product"),
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editor.library")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {types.map((type) => {
            const entry = SECTION_REGISTRY[type];
            const Icon = entry.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPick(type)}
                className="hover:border-primary hover:bg-accent focus-visible:ring-ring flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-medium">{t(entry.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
