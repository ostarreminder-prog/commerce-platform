"use client";

import { Globe, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";

/** Google-result mock — uses the dedicated serp-* tokens (see globals.css). */
export function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const t = useTranslations("storefront.seo");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="size-4" aria-hidden />
          {t("preview.serp")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="max-w-xl space-y-0.5 text-start">
          <p className="text-serp-url text-xs">{url}</p>
          <p className="text-serp-title line-clamp-1 text-lg leading-snug">{title || "…"}</p>
          <p className="text-muted-foreground line-clamp-2 text-sm">{description || "…"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Social-share (Open Graph) mock — how the home link renders in chat apps. */
export function SocialPreview({ title, description, image, host }: { title: string; description: string; image: string | null; host: string }) {
  const t = useTranslations("storefront.seo");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4" aria-hidden />
          {t("preview.social")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="max-w-xl overflow-hidden rounded-md border text-start">
          <div className="bg-muted flex h-40 items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview of arbitrary merchant media urls
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <Globe className="text-muted-foreground size-8" aria-hidden />
            )}
          </div>
          <div className="space-y-0.5 p-3">
            <p className="text-muted-foreground text-xs uppercase">{host}</p>
            <p className="line-clamp-1 text-sm font-semibold">{title || "…"}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">{description || "…"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
