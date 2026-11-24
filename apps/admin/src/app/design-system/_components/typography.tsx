import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@repo/ui/components/card";

export async function Typography() {
  const t = await getTranslations("designSystem.typography");
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-3xl font-bold tracking-tight">{t("h1")}</p>
        <p className="text-xl font-semibold">{t("h2")}</p>
        <p className="text-base font-medium">{t("h3")}</p>
        <p className="max-w-prose leading-7">{t("body")}</p>
        <p className="text-muted-foreground text-sm">{t("muted")}</p>
        <p className="num text-sm">{t("numbers")}</p>
      </CardContent>
    </Card>
  );
}
