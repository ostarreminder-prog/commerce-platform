"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAddOrderNote } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useCan } from "@/lib/permissions";

export function Notes({ order }: { order: Order }) {
  const t = useTranslations("sales.order");
  const add = useAddOrderNote();
  const canManage = useCan("orders.manage");
  const [text, setText] = React.useState("");
  return (
    <div className="space-y-3">
      {order.internalNotes.length ? (
        <ul className="space-y-2">
          {order.internalNotes.map((n, i) => (
            <li key={i} className="bg-muted/50 rounded-md p-2.5 text-sm">
              <p className="whitespace-pre-wrap">{n.text}</p>
              <p className="text-muted-foreground mt-1 text-xs">{n.actor.name}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("noNotes")}</p>
      )}
      {canManage ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            add.mutate([order.id, text.trim()], { onSuccess: () => { setText(""); toast.success(t("noteSaved")); } });
          }}
        >
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("notePlaceholder")} aria-label={t("notePlaceholder")} rows={2} />
          <Button type="submit" size="sm" variant="outline" disabled={!text.trim() || add.isPending}>{t("addNote")}</Button>
        </form>
      ) : null}
    </div>
  );
}
