import { getTranslations } from "next-intl/server";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";
import { VerificationView } from "@/features/settings/verification-view";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("verification.title")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="payments">
      <VerificationView />
    </SettingsScaffold>
  );
}
