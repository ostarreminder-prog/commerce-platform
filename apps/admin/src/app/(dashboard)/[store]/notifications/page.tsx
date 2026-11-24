import { getTranslations } from "next-intl/server";
import { NotificationsView } from "@/features/notifications/notifications-view";

export async function generateMetadata() {
  const t = await getTranslations("notifications");
  return { title: t("title") };
}

export default function Page() {
  return <NotificationsView />;
}
