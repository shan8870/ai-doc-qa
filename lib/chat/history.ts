import {
  MAX_CHAT_HISTORY_MESSAGES,
  RETRIEVAL_HISTORY_MESSAGES,
} from "@/lib/constants";
import type { ChatMessage } from "@/types/chat";

export function trimChatHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.content.trim(),
    )
    .slice(-MAX_CHAT_HISTORY_MESSAGES);
}

export function buildRetrievalQuery(
  question: string,
  messages: ChatMessage[],
): string {
  const recent = messages.slice(-RETRIEVAL_HISTORY_MESSAGES);

  if (recent.length === 0) {
    return question;
  }

  const history = recent
    .map((message) => {
      const label = message.role === "user" ? "User" : "Assistant";
      return `${label}: ${message.content}`;
    })
    .join("\n");

  return `${history}\nUser: ${question}`;
}

export function formatChatHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return "(No prior conversation)";
  }

  return messages
    .map((message) => {
      const label = message.role === "user" ? "User" : "Assistant";
      return `${label}: ${message.content}`;
    })
    .join("\n\n");
}
