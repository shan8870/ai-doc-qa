import { NextResponse } from "next/server";

import { embedTexts } from "@/lib/ai/gemini";
import { MAX_PDF_SIZE_BYTES } from "@/lib/constants";
import { parsePdf } from "@/lib/pdf/parse";
import { chunkText } from "@/lib/rag/chunk";
import { saveDocumentWithChunks } from "@/lib/rag/supabase-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, pageCount } = await parsePdf(buffer);

    if (!text) {
      return NextResponse.json(
        { error: "No extractable text found" },
        { status: 422 },
      );
    }

    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No extractable text found" },
        { status: 422 },
      );
    }

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));
    const embeddedChunks = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));

    const result = await saveDocumentWithChunks({
      filename: file.name,
      pageCount,
      text,
      chunks: embeddedChunks,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof Error && error.message.includes("Supabase")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process PDF",
      },
      { status: 422 },
    );
  }
}
