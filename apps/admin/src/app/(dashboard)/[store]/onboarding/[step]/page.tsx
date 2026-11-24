import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { STEPS, type Step } from "@/features/onboarding/steps";

export async function generateMetadata() {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default async function Page({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!(STEPS as readonly string[]).includes(step)) notFound();
  return <OnboardingWizard step={step as Step} />;
}
