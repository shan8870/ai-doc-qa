export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequest = {
  question: string;
  documentId: string;
  messages?: ChatMessage[];
};

export type Citation = {
  rank: number;
  chunkIndex: number;
  score: number;
  content: string;
};

export type StoredChatMessage = ChatMessage & {
  id: string;
  citations?: Citation[];
  createdAt: string;
};

export type ChatResponse = {
  answer: string;
  citations: Citation[];
  userMessageId: string;
  assistantMessageId: string;
};
