import { getTranslations } from "next-intl/server";
import { PagesList } from "@/features/storefront/pages/pages-list";

export async function generateMetadata() {
  const t = await getTranslations("storefront.pages");
  return { title: t("title") };
}

export default function Page() {
  return <PagesList />;
}
