import { getTranslations } from "next-intl/server";
import { StaffPanel } from "@/features/settings/staff-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.staff")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="staff">
      <StaffPanel />
    </SettingsScaffold>
  );
}
