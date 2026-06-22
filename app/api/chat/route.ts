import { NextResponse } from "next/server";

import { askDocumentQuestion, embedQuery } from "@/lib/ai/gemini";
import { buildRetrievalQuery, trimChatHistory } from "@/lib/chat/history";
import { saveChatTurn } from "@/lib/chat/supabase-repository";
import { RAG_TOP_K } from "@/lib/constants";
import {
  documentExists,
  matchDocumentChunks,
} from "@/lib/rag/supabase-repository";
import type { ChatRequest, ChatResponse, Citation } from "@/types/chat";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = body.question?.trim();
  const documentId = body.documentId?.trim();
  const history = trimChatHistory(body.messages ?? []);

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is required. Upload a PDF first." },
      { status: 400 },
    );
  }

  try {
    const exists = await documentExists(documentId);

    if (!exists) {
      return NextResponse.json(
        { error: "Document not found. Please upload the PDF again." },
        { status: 404 },
      );
    }

    const retrievalQuery = buildRetrievalQuery(question, history);
    const queryEmbedding = await embedQuery(retrievalQuery);
    const topChunks = await matchDocumentChunks(
      documentId,
      queryEmbedding,
      RAG_TOP_K,
    );

    if (topChunks.length === 0) {
      return NextResponse.json(
        { error: "No document chunks found for retrieval." },
        { status: 404 },
      );
    }

    const promptChunks = topChunks.map((chunk, index) => ({
      rank: index + 1,
      chunkIndex: chunk.chunk_index + 1,
      text: chunk.content,
    }));
    const answer = await askDocumentQuestion(question, promptChunks, history);
    const citations: Citation[] = topChunks.map((chunk, index) => ({
      rank: index + 1,
      chunkIndex: chunk.chunk_index + 1,
      score: Number(chunk.similarity.toFixed(2)),
      content: chunk.content,
    }));

    const saved = await saveChatTurn({
      documentId,
      question,
      answer,
      citations,
    });

    const response: ChatResponse = {
      answer,
      citations,
      userMessageId: saved.userMessageId,
      assistantMessageId: saved.assistantMessageId,
    };
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get answer from AI";

    if (message.includes("GEMINI_API_KEY") || message.includes("Supabase")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to get answer from AI. Please try again." },
      { status: 502 },
    );
  }
}
