"use client";

import * as React from "react";
import { CalendarClock, ExternalLink, Eye, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useApplyThemeAsDraft, useSetThemeWindow, useThemes } from "@repo/api-client";
import type { Theme } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { ImportThemeButton, ThemeActionsMenu } from "./theme-actions";

const STOREFRONT_URL = "http://localhost:3001";

/** ISO datetime → `datetime-local` input value (local wall time). */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function ThemeSwatch({ theme }: { theme: Theme }) {
  return (
    <div
      aria-hidden
      className="border-border flex h-28 items-end overflow-hidden rounded-lg border"
      style={{ backgroundColor: theme.globals.primaryColor }}
    >
      <div className="bg-paper/90 m-2 flex h-10 flex-1 items-center gap-2 rounded-md px-3">
        <span className="size-3 rounded-full" style={{ backgroundColor: theme.globals.primaryColor }} />
        <span className="text-ink flex-1 truncate text-xs font-medium">{theme.globals.announcementBar}</span>
      </div>
    </div>
  );
}

/** Temporary-theme window fields — the mock flips the active theme inside the window and reverts after. */
function WindowDialog({ theme, onDone }: { theme: Theme; onDone: () => void }) {
  const t = useTranslations("storefront.themes");
  const setWindow = useSetThemeWindow();
  const mt = useMsgToast();
  const [from, setFrom] = React.useState(theme.activeWindow ? toLocalInput(theme.activeWindow.from) : "");
  const [to, setTo] = React.useState(theme.activeWindow ? toLocalInput(theme.activeWindow.to) : "");

  const save = (window: { from: string; to: string } | null) => {
    setWindow.mutate([theme.id, window], {
      onSuccess: () => {
        mt.success("common.save.success");
        onDone();
      },
      onError: () => mt.error("common.save.error"),
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("window.title")}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="win-from">{t("window.from")}</Label>
          <Input id="win-from" type="datetime-local" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="win-to">{t("window.to")}</Label>
          <Input id="win-to" type="datetime-local" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <DialogFooter className="gap-2">
        {theme.activeWindow ? (
          <Button variant="outline" onClick={() => save(null)} disabled={setWindow.isPending}>
            {t("window.clear")}
          </Button>
        ) : null}
        <Button
          onClick={() => from && to && save({ from: new Date(from).toISOString(), to: new Date(to).toISOString() })}
          disabled={!from || !to || setWindow.isPending}
          loading={setWindow.isPending}
        >
          {t("window.save")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function ThemesView() {
  const t = useTranslations("storefront.themes");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const themes = useThemes();
  const apply = useApplyThemeAsDraft();
  const [applyTarget, setApplyTarget] = React.useState<Theme | null>(null);
  const [windowTarget, setWindowTarget] = React.useState<Theme | null>(null);

  const confirmApply = () => {
    if (!applyTarget) return;
    apply.mutate([applyTarget.id], {
      onSuccess: () => {
        mt.success("common.save.success");
        setApplyTarget(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<ImportThemeButton />} />
      <DataState
        state={themes}
        loading={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        }
      >
        {(list) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((theme) => (
              <Card key={theme.id} className="flex flex-col gap-4 p-4">
                <ThemeSwatch theme={theme} />
                <CardContent className="flex-1 space-y-2 p-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold">{theme.name}</h2>
                    <div className="flex items-center gap-1.5">
                      {theme.scheduledPublish ? <StatusBadge entity="theme" value="scheduled" /> : null}
                      <StatusBadge entity="theme" value={theme.status} />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("versions", { count: theme.versions.length })}
                    {theme.publishedAt ? ` · ${formatNumber(theme.sections.home.length)}` : ""}
                  </p>
                  {theme.scheduledPublish ? (
                    <p className="text-muted-foreground num text-xs">
                      {t("scheduledFor")}: {formatDateTime(theme.scheduledPublish.at, locale)}
                    </p>
                  ) : null}
                  {theme.activeWindow ? (
                    <p className="text-muted-foreground num text-xs">
                      {formatDateTime(theme.activeWindow.from, locale)} ← {formatDateTime(theme.activeWindow.to, locale)}
                    </p>
                  ) : null}
                </CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`${STOREFRONT_URL}/preview?theme=${theme.id}`} target="_blank" rel="noreferrer">
                      <Eye aria-hidden />
                      {t("preview")}
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/store-design">
                      <Wand2 aria-hidden />
                      {t("customize")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setWindowTarget(theme)}>
                    <CalendarClock aria-hidden />
                    {t("window.button")}
                  </Button>
                  {theme.status !== "published" ? (
                    <Button size="sm" onClick={() => setApplyTarget(theme)}>
                      {t("apply")}
                    </Button>
                  ) : null}
                  <ThemeActionsMenu theme={theme} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </DataState>
      <ConfirmDialog
        open={applyTarget !== null}
        onOpenChange={(v) => !v && setApplyTarget(null)}
        titleKey="themes.apply.title"
        bodyKey="themes.apply.body"
        confirmLabel={t("apply")}
        params={{ theme: applyTarget?.name ?? "" }}
        pending={apply.isPending}
        onConfirm={confirmApply}
      />
      <Dialog open={windowTarget !== null} onOpenChange={(v) => !v && setWindowTarget(null)}>
        {windowTarget ? <WindowDialog theme={windowTarget} onDone={() => setWindowTarget(null)} /> : null}
      </Dialog>
    </div>
  );
}
