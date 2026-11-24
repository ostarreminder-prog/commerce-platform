"use client";

import * as React from "react";
import { Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { useStoreFeatures } from "@/lib/features";

/** Per-category size tables (fixture — fashion categories only for now). */
const SIZE_TABLES: Record<string, { rows: string[][] }> = {
  cat_fashion: {
    rows: [
      ["S", "86-91", "66-71", "96"],
      ["M", "91-96", "71-76", "98"],
      ["L", "96-101", "76-81", "100"],
      ["XL", "101-106", "81-86", "102"],
    ],
  },
};

/** "دليل المقاسات" button + dialog — only renders for categories with a table. */
export function SizeGuideButton({ categoryId }: { categoryId: string }) {
  const t = useTranslations("store");
  const { on } = useStoreFeatures();
  const [open, setOpen] = React.useState(false);
  const table = SIZE_TABLES[categoryId];
  if (!on("sizeGuide") || !table) return null;

  return (
    <>
      <Button variant="link" size="sm" className="h-auto gap-1 px-0" onClick={() => setOpen(true)}>
        <Ruler className="size-3.5" aria-hidden />
        {t("sizeGuide")}
      </Button>
      {open ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("sizeGuide")}</DialogTitle>
              <DialogDescription className="sr-only">{t("sizeGuide")}</DialogDescription>
            </DialogHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-start">
                  <th className="py-2 text-start font-medium">{t("sizeRows.size")}</th>
                  <th className="py-2 text-start font-medium">{t("sizeRows.bust")}</th>
                  <th className="py-2 text-start font-medium">{t("sizeRows.waist")}</th>
                  <th className="py-2 text-start font-medium">{t("sizeRows.length")}</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r) => (
                  <tr key={r[0]} className="border-b last:border-0">
                    {r.map((cell, i) => (
                      <td key={i} className="num py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
