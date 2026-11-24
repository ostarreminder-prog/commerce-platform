import { Suspense } from "react";
import { PreviewView } from "@/features/preview/preview-view";

export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <PreviewView />
    </Suspense>
  );
}
