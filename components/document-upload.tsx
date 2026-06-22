"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MAX_PDF_SIZE_BYTES } from "@/lib/constants";
import type { UploadResult } from "@/types/document";

type DocumentUploadProps = {
  onUploaded: (result: UploadResult) => void;
  onError: (message: string) => void;
};

export function DocumentUpload({ onUploaded, onError }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      onError("Only PDF files are allowed");
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      onError("File too large (max 10MB)");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error ?? "Upload failed");
        return;
      }

      onUploaded(data as UploadResult);
    } catch {
      onError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-card text-card-foreground w-full rounded-xl border p-6">
      <h2 className="mb-2 text-lg font-medium">Upload</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        PDF only, up to 10MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        size="lg"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Upload />}
        {loading ? "Uploading..." : "Upload PDF"}
      </Button>
    </section>
  );
}
