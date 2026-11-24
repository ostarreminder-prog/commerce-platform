import { getTranslations } from "next-intl/server";
import { ProfilePanel } from "@/features/settings/profile-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.profile")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="profile">
      <ProfilePanel />
    </SettingsScaffold>
  );
}
