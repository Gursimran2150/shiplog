import type { Metadata } from "next";
import { JourneysView } from "@/features/journeys/JourneysView";

export const metadata: Metadata = { title: "Journeys" };

export default function Page() {
  return <JourneysView />;
}
