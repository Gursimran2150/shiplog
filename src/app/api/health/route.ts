import { connection } from "next/server";
import { getModel } from "@/lib/ai/provider";

/** Reports which AI provider is active, without exposing any secrets. */
export async function GET() {
  await connection();
  try {
    const { provider, modelId } = getModel();
    return Response.json({ status: "ok", provider, model: modelId });
  } catch {
    return Response.json({ status: "degraded", provider: null }, { status: 503 });
  }
}
