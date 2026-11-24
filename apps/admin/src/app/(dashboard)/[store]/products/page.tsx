import { getTranslations } from "next-intl/server";
import { ProductsList } from "@/features/catalog/products-list";

export async function generateMetadata() {
  const t = await getTranslations("catalog.products");
  return { title: t("title") };
}

export default function Page() {
  return <ProductsList />;
}
