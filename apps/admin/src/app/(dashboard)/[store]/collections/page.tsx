import { getTranslations } from "next-intl/server";
import { CollectionsList } from "@/features/catalog/collections";

export async function generateMetadata() {
  const t = await getTranslations("catalog.collections");
  return { title: t("title") };
}

export default function Page() {
  return <CollectionsList />;
}
