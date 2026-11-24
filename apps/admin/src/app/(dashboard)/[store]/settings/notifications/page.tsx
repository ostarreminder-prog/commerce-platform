import { getTranslations } from "next-intl/server";
import { NotificationsPanel } from "@/features/settings/notifications-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.notifications")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="notifications">
      <NotificationsPanel />
    </SettingsScaffold>
  );
}
