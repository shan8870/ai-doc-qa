import type { UploadResult } from "@/types/document";

type DocumentPreviewProps = {
  document: UploadResult | null;
};

export function DocumentPreview({ document }: DocumentPreviewProps) {
  if (!document) {
    return (
      <section className="bg-card text-card-foreground w-full rounded-xl border p-6">
        <h2 className="mb-2 text-lg font-medium">Document Preview</h2>
        <p className="text-muted-foreground text-sm">
          Upload a PDF to see filename, page count, and a text preview.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-card text-card-foreground w-full rounded-xl border p-6">
      <h2 className="mb-4 text-lg font-medium">Document Preview</h2>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Filename</dt>
          <dd className="font-medium">{document.filename}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pages</dt>
          <dd className="font-medium">{document.pageCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Chunks</dt>
          <dd className="font-medium">{document.chunkCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground mb-2">Preview (first 500 chars)</dt>
          <dd className="bg-muted max-h-48 overflow-y-auto rounded-md p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {document.preview}
          </dd>
        </div>
      </dl>
    </section>
  );
}
