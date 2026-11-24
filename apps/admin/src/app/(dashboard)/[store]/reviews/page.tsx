import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ReviewsView } from "@/features/reviews/reviews-view";

export async function generateMetadata() {
  const t = await getTranslations("catalog.reviews");
  return { title: t("title") };
}

export default function Page() {
  return (
    <Suspense>
      <ReviewsView />
    </Suspense>
  );
}
