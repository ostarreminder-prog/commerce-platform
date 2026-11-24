"use client";

import * as React from "react";
import { Bot, Link2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAssignConversation,
  useConversationAddTag,
  useLinkConversationCustomer,
  useLinkConversationOrder,
  useStaffList,
  useUnlinkConversationOrder,
} from "@repo/api-client";
import type { Conversation } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { EntityLink } from "@/components/entity/entity-link";
import { CustomerPicker, OrderPicker } from "./entity-pickers";

/** Right-hand context rail — summary, assignee, agent path, linked records, tags. */
export function ThreadSidebar({ c }: { c: Conversation }) {
  const t = useTranslations("inbox");
  const mt = useMsgToast();
  const staff = useStaffList();
  const assign = useAssignConversation();
  const addTag = useConversationAddTag();
  const linkOrder = useLinkConversationOrder();
  const unlinkOrder = useUnlinkConversationOrder();
  const linkCustomer = useLinkConversationCustomer();
  const [tagInput, setTagInput] = React.useState("");
  const [orderOpen, setOrderOpen] = React.useState(false);
  const [customerOpen, setCustomerOpen] = React.useState(false);

  return (
    <aside className="hidden w-72 shrink-0 space-y-4 overflow-y-auto border-s p-4 xl:block">
      {c.aiSummary ? (
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium">
              <Bot className="size-3.5" />
              {t("aiSummary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-xs leading-relaxed">{c.aiSummary}</CardContent>
        </Card>
      ) : null}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("customer")}</span>
          {c.customerId ? (
            <EntityLink type="customer" id={c.customerId} />
          ) : (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setCustomerOpen(true)}>
              <Link2 className="size-3" aria-hidden />
              {t("linkCustomer")}
            </Button>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("assignee")}</span>
          <Select value={c.assigneeId ?? "none"} onValueChange={(v) => assign.mutate([c.id, v === "none" ? null : v], { onSuccess: () => v !== "none" && mt.success("inbox.assigned", { staff: "" }) })}>
            <SelectTrigger className="h-7 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("filters.unassigned")}</SelectItem>
              {(staff.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("sentiment")}</span>
          <span>{t(`sentiments.${c.sentiment}`)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("rating")}</span>
          <span className="num">{c.rating ? `${c.rating}/5` : "—"}</span>
        </div>
        {c.agentPath.length ? (
          <div>
            <p className="text-muted-foreground mb-1">{t("agentPath")}</p>
            <ol className="space-y-1">
              {c.agentPath.map((a, i) => (
                <li key={i} className="text-xs">
                  <EntityLink type="agent" id={a} />
                  {i < c.agentPath.length - 1 ? <span className="text-muted-foreground"> ← </span> : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-muted-foreground">{t("relatedOrders")}</p>
            <Button variant="ghost" size="icon" className="size-6" aria-label={t("linkOrder")} onClick={() => setOrderOpen(true)}>
              <Link2 className="size-3.5" />
            </Button>
          </div>
          {c.relatedOrderIds.length ? (
            <ul className="space-y-1">
              {c.relatedOrderIds.map((o) => (
                <li key={o} className="flex items-center justify-between gap-2">
                  <EntityLink type="order" id={o} />
                  <Button variant="ghost" size="icon" className="size-6" aria-label={t("unlinkOrder")} onClick={() => unlinkOrder.mutate([c.id, o])}>
                    <X className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">{t("noLinkedOrders")}</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground mb-1">{t("tags")}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {c.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  addTag.mutate([c.id, tagInput.trim()]);
                  setTagInput("");
                }
              }}
              placeholder={t("tagPlaceholder")}
              className="h-7 w-24"
            />
          </div>
        </div>
      </div>
      <OrderPicker open={orderOpen} onOpenChange={setOrderOpen} onPick={(orderId) => linkOrder.mutate([c.id, orderId])} />
      <CustomerPicker open={customerOpen} onOpenChange={setCustomerOpen} onPick={(customerId) => linkCustomer.mutate([c.id, customerId])} />
    </aside>
  );
}
