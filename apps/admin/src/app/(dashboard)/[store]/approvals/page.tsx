import { getTranslations } from "next-intl/server";
import { ApprovalsView } from "@/features/approvals/approvals-view";

export async function generateMetadata() {
  const t = await getTranslations("approvals");
  return { title: t("title") };
}

export default function Page() {
  return <ApprovalsView />;
}
