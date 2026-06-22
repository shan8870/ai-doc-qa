import { EMBEDDING_DIMENSION, PREVIEW_LENGTH } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TextChunk } from "@/lib/rag/chunk";
import type { UploadResult } from "@/types/document";

type DocumentRow = {
  id: string;
  filename: string;
  page_count: number;
  full_text: string;
  preview: string;
  created_at: string;
};

type MatchChunkRow = {
  chunk_index: number;
  content: string;
  similarity: number;
};

export async function saveDocumentWithChunks(input: {
  filename: string;
  pageCount: number;
  text: string;
  chunks: Array<TextChunk & { embedding: number[] }>;
}): Promise<UploadResult> {
  const supabase = createAdminClient();

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      filename: input.filename,
      page_count: input.pageCount,
      full_text: input.text,
      preview: input.text.slice(0, PREVIEW_LENGTH),
    })
    .select("id, filename, page_count, preview")
    .single();

  if (documentError || !document) {
    throw new Error(documentError?.message ?? "Failed to save document");
  }

  const chunkRows = input.chunks.map((chunk) => ({
    document_id: document.id,
    chunk_index: chunk.index,
    content: chunk.text,
    embedding: formatEmbedding(chunk.embedding),
  }));

  const { error: chunksError } = await supabase
    .from("document_chunks")
    .insert(chunkRows);

  if (chunksError) {
    await supabase.from("documents").delete().eq("id", document.id);
    throw new Error(chunksError.message);
  }

  return {
    documentId: document.id,
    filename: document.filename,
    pageCount: document.page_count,
    preview: document.preview,
    chunkCount: input.chunks.length,
  };
}

export async function getLatestDocument(): Promise<UploadResult | null> {
  const supabase = createAdminClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, filename, page_count, preview")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !document) {
    return null;
  }

  const chunkCount = await getChunkCount(document.id);
  return mapDocumentRow(document, chunkCount);
}

export async function getDocumentById(
  documentId: string,
): Promise<UploadResult | null> {
  const supabase = createAdminClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, filename, page_count, preview")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !document) {
    return null;
  }

  const chunkCount = await getChunkCount(document.id);
  return mapDocumentRow(document, chunkCount);
}

export async function documentExists(documentId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function matchDocumentChunks(
  documentId: string,
  queryEmbedding: number[],
  matchCount: number,
): Promise<MatchChunkRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_document_chunks", {
    p_document_id: documentId,
    p_query_embedding: formatEmbedding(queryEmbedding),
    p_match_count: matchCount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MatchChunkRow[];
}

async function getChunkCount(documentId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function mapDocumentRow(
  document: Pick<DocumentRow, "id" | "filename" | "page_count" | "preview">,
  chunkCount: number,
): UploadResult {
  return {
    documentId: document.id,
    filename: document.filename,
    pageCount: document.page_count,
    preview: document.preview,
    chunkCount,
  };
}

function formatEmbedding(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`,
    );
  }

  return `[${embedding.join(",")}]`;
}
