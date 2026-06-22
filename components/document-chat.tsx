"use client";

import { Loader2, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AnswerMarkdown } from "@/components/answer-markdown";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ChatResponse, Citation } from "@/types/chat";

type UiMessage = ChatMessage & {
  id: string;
  citations?: Citation[];
};

type DocumentChatProps = {
  documentId: string | null;
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DocumentChat({ documentId }: DocumentChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasDocument = Boolean(documentId);

  useEffect(() => {
    setInput("");
    setError(null);

    if (!documentId) {
      setMessages([]);
      return;
    }

    async function loadHistory() {
      setLoadingHistory(true);

      try {
        const response = await fetch(
          `/api/chat/messages?documentId=${encodeURIComponent(documentId)}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Failed to load chat history");
          setMessages([]);
          return;
        }

        setMessages(
          (data.messages as Array<{
            id: string;
            role: ChatMessage["role"];
            content: string;
            citations?: Citation[];
          }>).map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            citations: message.citations,
          })),
        );
      } catch {
        setError("Failed to load chat history");
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    void loadHistory();
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleAsk() {
    const trimmedQuestion = input.trim();

    if (!documentId) {
      setError("Upload a PDF before asking questions.");
      return;
    }

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    const userMessage: UiMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmedQuestion,
    };

    const priorMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmedQuestion,
          documentId,
          messages: priorMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to get answer");
        return;
      }

      const chatResponse = data as ChatResponse;

      setMessages((current) =>
        current.map((message) =>
          message.id === userMessage.id
            ? { ...message, id: chatResponse.userMessageId }
            : message,
        ),
      );

      const assistantMessage: UiMessage = {
        id: chatResponse.assistantMessageId,
        role: "assistant",
        content: chatResponse.answer,
        citations: chatResponse.citations,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setError("Failed to get answer");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleAsk();
    }
  }

  return (
    <section className="bg-card text-card-foreground w-full rounded-xl border p-6">
      <h2 className="mb-2 text-lg font-medium">Q&amp;A</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        {hasDocument
          ? "Ask questions about the document. Follow-up questions keep context from earlier messages."
          : "Upload a PDF first to enable Q&A."}
      </p>

      <div className="space-y-4">
        {loadingHistory ? (
          <p className="text-muted-foreground text-sm">Loading chat history...</p>
        ) : null}

        {messages.length > 0 ? (
          <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-md border p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-md bg-primary/10 p-3 text-sm"
                    : "mr-8 space-y-3 rounded-md bg-muted p-3 text-sm"
                }
              >
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  {message.role === "user" ? "You" : "AI"}
                </p>
                {message.role === "user" ? (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                ) : (
                  <AnswerMarkdown content={message.content} />
                )}

                {message.citations?.length ? (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">
                      Sources ({message.citations.length})
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {message.citations.map((citation) => (
                        <li
                          key={`${message.id}-${citation.rank}-${citation.chunkIndex}`}
                          className="rounded-md border bg-background p-2"
                        >
                          <p className="mb-1 font-medium">
                            [{citation.rank}] Chunk {citation.chunkIndex} (
                            {citation.score.toFixed(2)})
                          </p>
                          <p className="text-muted-foreground max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                            {citation.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        ) : null}

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Summarize chapter 3"
          disabled={!hasDocument || loading || loadingHistory}
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        />

        <Button
          type="button"
          disabled={!hasDocument || loading || loadingHistory || !input.trim()}
          onClick={() => void handleAsk()}
        >
          {loading ? <Loader2 className="animate-spin" /> : <MessageSquare />}
          {loading ? "Asking..." : "Ask"}
        </Button>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
