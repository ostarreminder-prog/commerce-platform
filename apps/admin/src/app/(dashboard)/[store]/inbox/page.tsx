import { getTranslations } from "next-intl/server";
import { InboxScreen } from "@/features/inbox/inbox";

export async function generateMetadata() {
  const t = await getTranslations("inbox");
  return { title: t("title") };
}

export default function Page() {
  return <InboxScreen />;
}
