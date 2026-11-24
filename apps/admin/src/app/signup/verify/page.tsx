import { getTranslations } from "next-intl/server";
import { VerifyForm } from "@/features/auth/verify-form";

export async function generateMetadata() {
  const t = await getTranslations("signup");
  return { title: t("verify.title") };
}

export default function VerifyPage() {
  return <VerifyForm />;
}
