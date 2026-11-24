import { Suspense } from "react";
import { TrackView } from "@/features/track/track-view";

export default function TrackPage() {
  return (
    <Suspense>
      <TrackView />
    </Suspense>
  );
}
