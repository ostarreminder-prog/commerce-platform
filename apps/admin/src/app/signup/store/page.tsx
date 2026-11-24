import { getTranslations } from "next-intl/server";
import { StoreSetupForm } from "@/features/auth/store-setup-form";

export async function generateMetadata() {
  const t = await getTranslations("signup");
  return { title: t("store.title") };
}

export default function StoreSetupPage() {
  return <StoreSetupForm />;
}
