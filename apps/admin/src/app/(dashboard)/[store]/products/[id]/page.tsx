import { getTranslations } from "next-intl/server";
import { ProductEditor } from "@/features/catalog/product-editor";

export async function generateMetadata() {
  const t = await getTranslations("catalog.editor");
  return { title: t("title") };
}

export default function Page() {
  return <ProductEditor />;
}
