import { NextResponse } from "next/server";

import { getLatestDocument } from "@/lib/rag/supabase-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const document = await getLatestDocument();
    return NextResponse.json({ document });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load document";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
