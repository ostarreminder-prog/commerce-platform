import { getTranslations } from "next-intl/server";
import { CollectionDetail } from "@/features/catalog/collections";

export async function generateMetadata() {
  const t = await getTranslations("collections.detail");
  return { title: t("title") };
}

export default function Page() {
  return <CollectionDetail />;
}
