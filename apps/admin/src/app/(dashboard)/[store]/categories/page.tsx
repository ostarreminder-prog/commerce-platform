import { getTranslations } from "next-intl/server";
import { CategoriesView } from "@/features/catalog/categories-view";

export async function generateMetadata() {
  const t = await getTranslations("catalog.categories");
  return { title: t("title") };
}

export default function Page() {
  return <CategoriesView />;
}
