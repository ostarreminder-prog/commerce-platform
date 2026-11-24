import Link from "@/components/store-link";
import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";

export default async function ComingSoonPage() {
  const t = await getTranslations("common");
  return (
    <EmptyState
      icon={Construction}
      title={t("comingSoon")}
      description={t("comingSoonDescription")}
      action={
        <Button asChild variant="outline">
          <Link href="/">{t("goHome")}</Link>
        </Button>
      }
      className="mt-10"
    />
  );
}
