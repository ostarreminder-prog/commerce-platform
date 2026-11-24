import { getTranslations } from "next-intl/server";
import { ImportsView } from "@/features/catalog/imports";

export async function generateMetadata() {
  const t = await getTranslations("catalog.imports");
  return { title: t("title") };
}

export default function Page() {
  return <ImportsView />;
}
