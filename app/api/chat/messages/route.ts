import { NextResponse } from "next/server";

import { getChatMessages } from "@/lib/chat/supabase-repository";
import { documentExists } from "@/lib/rag/supabase-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const documentId = new URL(request.url).searchParams
    .get("documentId")
    ?.trim();

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is required." },
      { status: 400 },
    );
  }

  try {
    const exists = await documentExists(documentId);

    if (!exists) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }

    const messages = await getChatMessages(documentId);
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load chat history";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
