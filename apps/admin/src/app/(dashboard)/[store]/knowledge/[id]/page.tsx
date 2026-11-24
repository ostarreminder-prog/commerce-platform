import { getTranslations } from "next-intl/server";
import { KnowledgeDetail } from "@/features/knowledge/knowledge";

export async function generateMetadata() {
  const t = await getTranslations("knowledge.detail");
  return { title: t("title") };
}

export default function Page() {
  return <KnowledgeDetail />;
}
