import { getTranslations } from "next-intl/server";
import { Badge } from "@repo/ui/components/badge";

export async function BadgesDemo() {
  const t = await getTranslations("designSystem.badges");
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">{t("paid")}</Badge>
      <Badge variant="warning">{t("pending")}</Badge>
      <Badge variant="secondary">{t("refunded")}</Badge>
      <Badge variant="destructive">{t("failed")}</Badge>
      <Badge>{t("shipped")}</Badge>
      <Badge variant="outline">{t("draft")}</Badge>
      <Badge variant="info">{t("info")}</Badge>
    </div>
  );
}
