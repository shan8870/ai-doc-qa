"use client";

import { useEffect, useState } from "react";

import { DocumentChat } from "@/components/document-chat";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentUpload } from "@/components/document-upload";
import type { UploadResult } from "@/types/document";

export function DocumentWorkspace() {
  const [document, setDocument] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(true);

  useEffect(() => {
    async function loadLatestDocument() {
      try {
        const response = await fetch("/api/documents/latest");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Failed to load saved document");
          return;
        }

        if (data.document) {
          setDocument(data.document);
        }
      } catch {
        setError("Failed to load saved document");
      } finally {
        setLoadingDocument(false);
      }
    }

    void loadLatestDocument();
  }, []);

  function handleUploaded(result: UploadResult) {
    setDocument(result);
    setError(null);
  }

  function handleError(message: string) {
    setError(message || null);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <DocumentUpload onUploaded={handleUploaded} onError={handleError} />

      {loadingDocument ? (
        <p className="text-muted-foreground text-sm">Loading saved document...</p>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <DocumentPreview document={document} />

      <DocumentChat documentId={document?.documentId ?? null} />
    </div>
  );
}
