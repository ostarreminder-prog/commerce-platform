"use client";

import * as React from "react";
import { Plus, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";

export function ButtonsDemo() {
  const t = useTranslations("designSystem.buttons");
  const [loading, setLoading] = React.useState(false);

  const simulate = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button>{t("primary")}</Button>
        <Button variant="secondary">{t("secondary")}</Button>
        <Button variant="outline">{t("outline")}</Button>
        <Button variant="ghost">{t("ghost")}</Button>
        <Button variant="destructive">{t("destructive")}</Button>
        <Button variant="link">{t("link")}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">{t("small")}</Button>
        <Button size="lg">{t("large")}</Button>
        <Button>
          <Plus aria-hidden />
          {t("withIcon")}
        </Button>
        <Button variant="outline" size="icon" aria-label={t("iconOnly")}>
          <Settings aria-hidden />
        </Button>
        <Button disabled>{t("disabled")}</Button>
        <Button loading={loading} onClick={simulate}>
          {loading ? t("loading") : t("simulateLoading")}
        </Button>
      </div>
    </div>
  );
}
