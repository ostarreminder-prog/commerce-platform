import { getTranslations } from "next-intl/server";
import { BrandsView } from "@/features/catalog/brands";

export async function generateMetadata() {
  const t = await getTranslations("catalog.brands");
  return { title: t("title") };
}

export default function Page() {
  return <BrandsView />;
}
