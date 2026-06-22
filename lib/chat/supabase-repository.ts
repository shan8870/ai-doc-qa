import { createAdminClient } from "@/lib/supabase/admin";
import type { Citation, StoredChatMessage } from "@/types/chat";

type ChatMessageRow = {
  id: string;
  document_id: string;
  role: "user" | "assistant";
  content: string;
  citations: string | null;
  created_at: string;
};

export async function getChatMessages(
  documentId: string,
): Promise<StoredChatMessage[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, document_id, role, content, citations, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapChatMessageRow);
}

export async function saveChatTurn(input: {
  documentId: string;
  question: string;
  answer: string;
  citations: Citation[];
}): Promise<{ userMessageId: string; assistantMessageId: string }> {
  const supabase = createAdminClient();

  const { data: userMessage, error: userError } = await supabase
    .from("chat_messages")
    .insert({
      document_id: input.documentId,
      role: "user",
      content: input.question,
    })
    .select("id")
    .single();

  if (userError || !userMessage) {
    throw new Error(userError?.message ?? "Failed to save user message");
  }

  const { data: assistantMessage, error: assistantError } = await supabase
    .from("chat_messages")
    .insert({
      document_id: input.documentId,
      role: "assistant",
      content: input.answer,
      citations: JSON.stringify(input.citations),
    })
    .select("id")
    .single();

  if (assistantError || !assistantMessage) {
    await supabase.from("chat_messages").delete().eq("id", userMessage.id);
    throw new Error(
      assistantError?.message ?? "Failed to save assistant message",
    );
  }

  return {
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
  };
}

function mapChatMessageRow(row: ChatMessageRow): StoredChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    citations: parseCitations(row.citations),
    createdAt: row.created_at,
  };
}

function parseCitations(value: string | null): Citation[] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Citation[];
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
