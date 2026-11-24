"use client";

import { useTranslations } from "next-intl";
import type { Agent } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Textarea } from "@repo/ui/components/textarea";
import { useWarningText } from "./agent-meta";
import { ConfirmDialog } from "./detail/shared";
import type { AgentWarning } from "./tree";

export function PublishDialog({
  open,
  onOpenChange,
  draft,
  warnings,
  note,
  onNoteChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: Agent;
  warnings: AgentWarning[];
  note: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("studio.detail");
  const warnText = useWarningText();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("publishTitle", { name: draft.name, v: draft.version + 1 })}
      description={t("publishBody")}
      confirmLabel={t("footer.publish")}
      onConfirm={onConfirm}
    >
      {warnings.length ? (
        <Alert variant="warning">
          <AlertDescription>
            <p className="font-medium">{t("publishWarnings", { count: warnings.length })}</p>
            <ul className="mt-1 list-disc ps-4 text-xs">
              {warnings.map((w, i) => (
                <li key={i}>{warnText(w)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder={t("notePlaceholder")}
        aria-label={t("note")}
        rows={3}
      />
    </ConfirmDialog>
  );
}
