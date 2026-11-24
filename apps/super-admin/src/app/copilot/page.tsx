import { getTranslations } from "next-intl/server";
import { CopilotPage } from "@/features/copilot/copilot-page";

export async function generateMetadata() {
  const t = await getTranslations("msg.copilot");
  return { title: t("title") };
}

export default function Page() {
  return <CopilotPage />;
}
