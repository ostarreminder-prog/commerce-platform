import { getTranslations } from "next-intl/server";
import { DomainsView } from "@/features/storefront/domains/domains-view";

export async function generateMetadata() {
  const t = await getTranslations("storefront.domains");
  return { title: t("title") };
}

export default function Page() {
  return <DomainsView />;
}
