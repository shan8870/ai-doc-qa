import { CHUNK_OVERLAP, CHUNK_SIZE } from "@/lib/constants";

export { CHUNK_OVERLAP, CHUNK_SIZE };

export type TextChunk = {
  id: string;
  index: number;
  text: string;
  preview: string;
};

export function chunkText(text: string): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf("\n", end);
      if (boundary > start + CHUNK_SIZE / 2) {
        end = boundary;
      }
    }

    const chunkText = normalized.slice(start, end).trim();

    if (chunkText) {
      chunks.push({
        id: `chunk-${index}`,
        index,
        text: chunkText,
        preview: chunkText.slice(0, 220),
      });
      index += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}
