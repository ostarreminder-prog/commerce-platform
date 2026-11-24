import { Suspense } from "react";
import { CategoryView } from "@/features/category/category-view";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  /* Suspense required — the filter toolbar reads useSearchParams. */
  return (
    <Suspense>
      <CategoryView slug={slug} />
    </Suspense>
  );
}
