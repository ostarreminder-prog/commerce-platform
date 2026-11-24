"use client";

import * as React from "react";
import { ExternalLink, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddSeoRedirect, useDeleteSeoRedirect, useDomains, useSaveStorefrontSeo, useSeoRedirects, useStorefrontSeo } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/cn";
import { MediaField } from "@/components/media-field";
import { mediaToRef, useMediaLibrary } from "@/lib/media";
import { SerpPreview, SocialPreview } from "./seo-previews";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";
const TITLE_WARN = 50;
const DESC_WARN = 155;

function Counter({ value, warn }: { value: number; warn: number }) {
  return <span className={cn("text-xs tabular-nums", value > warn ? "text-warning" : "text-muted-foreground")}>{value}</span>;
}

export function SeoView() {
  const t = useTranslations("storefront.seo");
  const mt = useMsgToast();
  const seo = useStorefrontSeo();
  const redirects = useSeoRedirects();
  const saveSeo = useSaveStorefrontSeo();
  const addRedirect = useAddSeoRedirect();
  const delRedirect = useDeleteSeoRedirect();
  const lib = useMediaLibrary();
  const { data: domains = [] } = useDomains();
  const host = domains.find((d) => d.isPrimary)?.hostname ?? domains[0]?.hostname ?? "store.sa";

  const [form, setForm] = React.useState({ title: "", description: "", shareImage: "" });
  const [loaded, setLoaded] = React.useState(false);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  React.useEffect(() => {
    if (seo.data && !loaded) {
      setForm({ title: seo.data.title, description: seo.data.description, shareImage: seo.data.shareImage?.url ?? "" });
      setLoaded(true);
    }
  }, [seo.data, loaded]);

  const titleEmpty = !form.title.trim();
  const titleLong = form.title.trim().length > TITLE_WARN;
  const descLong = form.description.trim().length > DESC_WARN;

  const submitSeo = () => {
    if (!seo.data || titleEmpty) return;
    /* Resolve the picked url back to a library entry so shareImage stays a full
     * MediaRef; uploaded/cropped data-urls get a synthetic 1200×630 ref. */
    const media = lib.images.find((m) => m.url === form.shareImage);
    const shareImage = form.shareImage
      ? media
        ? mediaToRef(media, form.title.trim())
        : { id: "seo-og", url: form.shareImage, alt: { ar: form.title.trim() }, width: 1200, height: 630 }
      : null;
    saveSeo.mutate([{ title: form.title.trim(), description: form.description.trim(), shareImage }], {
      onSuccess: () => mt.success("common.save.success"),
      onError: () => mt.error("common.save.error"),
    });
  };

  const submitRedirect = () => {
    if (!from.trim().startsWith("/") || !to.trim().startsWith("/")) return;
    addRedirect.mutate([{ from: from.trim(), to: to.trim() }], {
      onSuccess: () => {
        mt.success("seo.redirect.added");
        setFrom("");
        setTo("");
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("home.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {seo.status === "pending" ? (
                <Skeleton className="h-64" />
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo-title">{t("home.seoTitle")}</Label>
                      <Counter value={form.title.length} warn={TITLE_WARN} />
                    </div>
                    <Input id="seo-title" value={form.title} maxLength={70} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                    {titleEmpty ? <p className="text-destructive text-xs">{t("validation.titleRequired")}</p> : null}
                    {titleLong ? (
                      <p className="text-warning flex items-center gap-1 text-xs">
                        <TriangleAlert className="size-3" aria-hidden />
                        {t("validation.titleLong")}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo-desc">{t("home.seoDescription")}</Label>
                      <Counter value={form.description.length} warn={DESC_WARN} />
                    </div>
                    <Textarea id="seo-desc" rows={3} maxLength={200} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                    {descLong ? (
                      <p className="text-warning flex items-center gap-1 text-xs">
                        <TriangleAlert className="size-3" aria-hidden />
                        {t("validation.descLong")}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("home.shareImage")}</Label>
                    <MediaField value={form.shareImage || null} aspect="16:9" onChange={(url) => setForm((f) => ({ ...f, shareImage: url ?? "" }))} />
                    <p className="text-muted-foreground text-xs">{t("home.shareImageHint")}</p>
                  </div>
                  <Button onClick={submitSeo} loading={saveSeo.isPending} disabled={titleEmpty}>
                    {t("home.save")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("redirects.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input dir="ltr" className="flex-1 text-start" placeholder={t("redirects.hint")} value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t("redirects.from")} />
                <Input dir="ltr" className="flex-1 text-start" placeholder="/new-page" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t("redirects.to")} />
                <Button variant="outline" onClick={submitRedirect} loading={addRedirect.isPending} disabled={!from.trim() || !to.trim()}>
                  <Plus aria-hidden />
                  {t("redirects.add")}
                </Button>
              </div>
              <DataState state={redirects} loading={<Skeleton className="h-28" />} isEmpty={(d) => d.length === 0} empty={<MsgEmptyState emptyKey="redirects" />}>
                {(list) => (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("redirects.from")}</TableHead>
                          <TableHead>{t("redirects.to")}</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell dir="ltr" className="text-start font-mono text-xs">
                              {r.from}
                            </TableCell>
                            <TableCell dir="ltr" className="text-start font-mono text-xs">
                              {r.to}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive size-8"
                                aria-label={t("redirects.remove")}
                                onClick={() => delRedirect.mutate([r.id], { onSuccess: () => mt.success("seo.redirect.deleted") })}
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </DataState>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <SerpPreview title={form.title.trim()} description={form.description.trim()} url={`https://${host}`} />
          <SocialPreview title={form.title.trim()} description={form.description.trim()} image={form.shareImage || null} host={host} />
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">{t("sitemap.title")}</p>
                <p className="text-muted-foreground text-xs">{t("sitemap.hint")}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`${STOREFRONT_URL}/sitemap.xml`} target="_blank" rel="noreferrer">
                    {t("sitemap.open")}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`${STOREFRONT_URL}/robots.txt`} target="_blank" rel="noreferrer">
                    robots.txt
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
