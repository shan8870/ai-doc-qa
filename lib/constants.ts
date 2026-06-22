export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
export const PREVIEW_LENGTH = 500;

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;
export const RAG_TOP_K = 5;
export const EMBEDDING_DIMENSION = 768;

/** Max prior turns sent to the model (user + assistant pairs). */
export const MAX_CHAT_HISTORY_MESSAGES = 20;
/** Recent turns included in retrieval query for follow-up questions. */
export const RETRIEVAL_HISTORY_MESSAGES = 4;
