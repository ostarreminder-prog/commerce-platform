import { getTranslations } from "next-intl/server";
import { ImportDetail } from "@/features/catalog/imports";

export async function generateMetadata() {
  const t = await getTranslations("catalog.imports.detail");
  return { title: t("title") };
}

export default function Page() {
  return <ImportDetail />;
}
