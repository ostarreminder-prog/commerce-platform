"use client";

import * as React from "react";
import { Archive, Bell, CheckCheck, ChevronLeft, ChevronRight, Search, Settings2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMarkNotificationsRead, useNotificationList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useUrlState } from "@/lib/url-state";
import { NotificationRow } from "./notification-row";
import { PrefsPanel } from "./prefs-panel";
import { DEFAULTS, EVENTS, matchesFilters } from "./notifications-shared";

const LIMITS = ["10", "20", "50"];

/** `/notifications` — central notification center (list + preferences). */
export function NotificationsView() {
  const t = useTranslations("notifications");
  const mt = useMsgToast();
  const [f, set] = useUrlState(DEFAULTS);
  const list = useNotificationList();
  const markRead = useMarkNotificationsRead();

  const q = f.q.trim().toLowerCase();
  const all = list.data ?? [];
  const visible = all.filter((n) => matchesFilters(n, f, q));
  const unread = all.filter((n) => !n.read && !n.archived).length;
  const limit = Math.max(1, Number(f.limit) || 10);
  const pages = Math.max(1, Math.ceil(visible.length / limit));
  const page = Math.min(Math.max(1, Number(f.page) || 1), pages);
  const slice = visible.slice((page - 1) * limit, page * limit);
  const hasFilters = f.event !== "all" || f.read !== "all" || f.date !== "all" || f.q !== "" || f.box !== "active";
  const reset = () => set({ ...DEFAULTS, view: f.view });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={() => markRead.mutate([undefined], { onSuccess: () => mt.success("notifications.allRead") })}>
              <CheckCheck aria-hidden /> {t("actions.markAllRead")}
            </Button>
          ) : undefined
        }
      />
      <Tabs value={f.view} onValueChange={(v) => set({ view: v })}>
        <TabsList>
          <TabsTrigger value="list"><Bell aria-hidden /> {t("tabs.list")}</TabsTrigger>
          <TabsTrigger value="prefs"><Settings2 aria-hidden /> {t("tabs.prefs")}</TabsTrigger>
        </TabsList>
      </Tabs>
      {f.view === "prefs" ? (
        <PrefsPanel />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
              <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Select value={f.box} onValueChange={(v) => set({ box: v })}>
                <SelectTrigger className="sm:w-32" aria-label={t("filters.box")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("box.active")}</SelectItem>
                  <SelectItem value="archived"><span className="inline-flex items-center gap-1.5"><Archive className="size-3.5" aria-hidden />{t("box.archived")}</span></SelectItem>
                </SelectContent>
              </Select>
              <Select value={f.event} onValueChange={(v) => set({ event: v })}>
                <SelectTrigger className="sm:w-44" aria-label={t("filters.event")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allEvents")}</SelectItem>
                  {EVENTS.map((e) => <SelectItem key={e} value={e}>{t(`events.${e}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={f.read} onValueChange={(v) => set({ read: v })}>
                <SelectTrigger className="sm:w-32" aria-label={t("filters.read")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allRead")}</SelectItem>
                  <SelectItem value="unread">{t("filters.unread")}</SelectItem>
                  <SelectItem value="read">{t("filters.readOnly")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={f.date} onValueChange={(v) => set({ date: v })}>
                <SelectTrigger className="sm:w-32" aria-label={t("filters.date")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allDates")}</SelectItem>
                  <SelectItem value="today">{t("filters.today")}</SelectItem>
                  <SelectItem value="week">{t("filters.week")}</SelectItem>
                  <SelectItem value="month">{t("filters.month")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={reset} className="self-start lg:self-auto"><X aria-hidden />{t("resetFilters")}</Button>
            ) : null}
            <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: visible.length })}</span>
          </div>
          <DataState
            state={list}
            loading={<div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
            isEmpty={(d) => d.length === 0}
            empty={<Card><EmptyState icon={Bell} title={t("empty.title")} description={t("empty.body")} /></Card>}
          >
            {() =>
              slice.length === 0 ? (
                <Card><EmptyState icon={Search} title={t("emptyFiltered.title")} description={t("emptyFiltered.body")} action={<Button variant="outline" onClick={reset}>{t("resetFilters")}</Button>} /></Card>
              ) : (
                <>
                  <Card className="divide-y overflow-hidden">
                    <ul>{slice.map((n) => <NotificationRow key={n.id} n={n} />)}</ul>
                  </Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={String(limit)} onValueChange={(v) => set({ limit: v })}>
                      <SelectTrigger className="w-36" aria-label={t("pagination.perPage")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LIMITS.map((l) => <SelectItem key={l} value={l}>{t("pagination.perPage", { count: Number(l) })}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground num text-sm">{t("pagination.page", { page, pages })}</span>
                    <div className="ms-auto flex gap-1">
                      <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} aria-label={t("pagination.prev")} onClick={() => set({ page: String(page - 1) }, { resetPage: false })}>
                        <ChevronRight className="size-4 rtl:hidden" aria-hidden /><ChevronLeft className="size-4 ltr:hidden" aria-hidden />
                      </Button>
                      <Button variant="outline" size="icon" className="size-8" disabled={page >= pages} aria-label={t("pagination.next")} onClick={() => set({ page: String(page + 1) }, { resetPage: false })}>
                        <ChevronLeft className="size-4 rtl:hidden" aria-hidden /><ChevronRight className="size-4 ltr:hidden" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </>
              )
            }
          </DataState>
        </div>
      )}
    </div>
  );
}
