import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/features/auth/signup-form";

export async function generateMetadata() {
  const t = await getTranslations("signup");
  return { title: t("title") };
}

export default function SignupPage() {
  return <SignupForm />;
}
