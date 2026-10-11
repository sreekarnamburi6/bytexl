import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getLocalAiServiceConfig, localAiHeaders } from "@/lib/local-ai-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const service = getLocalAiServiceConfig();
  if (!service) return NextResponse.json({ error: "The local model service is not configured." }, { status: 503 });

  try {
    const response = await fetch(`${service.baseUrl}/v1/models`, {
      headers: localAiHeaders(service.token),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.models)) {
      return NextResponse.json({ error: "The local model service is unavailable." }, { status: 503 });
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Start the local disease model service to list available models." }, { status: 503 });
  }
}