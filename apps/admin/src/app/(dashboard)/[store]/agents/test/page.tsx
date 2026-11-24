import { getTranslations } from "next-intl/server";
import { TestLab } from "@/features/studio/lab/test-lab";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: `${t("tabs.test")} · ${t("title")}` };
}

export default function AgentTestPage() {
  return <TestLab />;
}
