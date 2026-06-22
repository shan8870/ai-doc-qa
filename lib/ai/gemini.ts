import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

import { formatChatHistory } from "@/lib/chat/history";
import { EMBEDDING_DIMENSION } from "@/lib/constants";
import type { ChatMessage } from "@/types/chat";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

export type PromptChunk = {
  rank: number;
  chunkIndex: number;
  text: string;
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenerativeAI(apiKey);
}

function l2Normalize(values: number[]): number[] {
  let sumSquares = 0;
  for (const value of values) {
    sumSquares += value * value;
  }

  const norm = Math.sqrt(sumSquares);
  if (norm === 0) {
    return values;
  }

  return values.map((value) => value / norm);
}

function buildEmbedRequest(text: string, taskType: TaskType) {
  return {
    content: {
      role: "user" as const,
      parts: [{ text }],
    },
    taskType,
    // gemini-embedding-001 defaults to 3072; DB uses vector(768).
    outputDimensionality: EMBEDDING_DIMENSION,
  };
}

export async function askDocumentQuestion(
  question: string,
  chunks: PromptChunk[],
  history: ChatMessage[] = [],
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL });
  const context = chunks
    .map(
      (chunk) =>
        `[Source ${chunk.rank}] (Document Chunk ${chunk.chunkIndex})\n${chunk.text}`,
    )
    .join("\n\n");
  const conversation = formatChatHistory(history);

  const prompt = `You are a document Q&A assistant. Answer using the retrieved sources below and the conversation history.
If the answer is not in the sources, say you cannot find it in the document.
For follow-up questions (e.g. "explain the second point in more detail"), use both the conversation history and the sources.
Answer in the same language as the latest user question.

Answer rules:
- Format the answer in Markdown. Use bullet points or numbered lists when helpful.
- Do not include inline citations like [1] or [2] in the answer.

--- Retrieved Sources ---
${context}
--- End of Retrieved Sources ---

--- Conversation History ---
${conversation}
--- End of Conversation History ---

Latest question: ${question}`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  if (!answer?.trim()) {
    throw new Error("Empty response from Gemini");
  }

  return answer.trim();
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const response = await model.batchEmbedContents({
    requests: texts.map((text) =>
      buildEmbedRequest(text, TaskType.RETRIEVAL_DOCUMENT),
    ),
  });

  return response.embeddings.map((item) => l2Normalize(item.values));
}

export async function embedQuery(text: string): Promise<number[]> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const response = await model.embedContent(
    buildEmbedRequest(text, TaskType.RETRIEVAL_QUERY),
  );

  return l2Normalize(response.embedding.values);
}
