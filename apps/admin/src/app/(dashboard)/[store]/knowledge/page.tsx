import { getTranslations } from "next-intl/server";
import { KnowledgeList } from "@/features/knowledge/knowledge";

export async function generateMetadata() {
  const t = await getTranslations("knowledge");
  return { title: t("title") };
}

export default function Page() {
  return <KnowledgeList />;
}
