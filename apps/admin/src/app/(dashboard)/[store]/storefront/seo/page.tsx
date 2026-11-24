import { getTranslations } from "next-intl/server";
import { SeoView } from "@/features/storefront/seo/seo-view";

export async function generateMetadata() {
  const t = await getTranslations("storefront.seo");
  return { title: t("title") };
}

export default function Page() {
  return <SeoView />;
}
