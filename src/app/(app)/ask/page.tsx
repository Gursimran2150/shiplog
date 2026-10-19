import type { Metadata } from "next";
import { AskView } from "@/features/ask/AskView";

export const metadata: Metadata = { title: "Ask your journal" };

export default function Page() {
  return <AskView />;
}
