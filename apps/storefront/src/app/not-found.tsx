import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PackageSearch } from "lucide-react";
import { Button } from "@repo/ui/components/button";

export default async function NotFound() {
  const t = await getTranslations("store");
  return (
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center py-20 text-center">
      <PackageSearch className="text-muted-foreground size-16" aria-hidden />
      <h1 className="mt-6 text-6xl font-bold">404</h1>
      <p className="mt-2 text-xl font-semibold">{t("notFoundTitle")}</p>
      <p className="text-muted-foreground mt-1 max-w-md">{t("notFoundText")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">{t("backHome")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">{t("search")}</Link>
        </Button>
      </div>
    </div>
  );
}
