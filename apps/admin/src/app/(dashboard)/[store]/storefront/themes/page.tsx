import { getTranslations } from "next-intl/server";
import { ThemesView } from "@/features/storefront/themes/themes-view";

export async function generateMetadata() {
  const t = await getTranslations("storefront.themes");
  return { title: t("title") };
}

export default function Page() {
  return <ThemesView />;
}
