import { DocumentWorkspace } from "@/components/document-workspace";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Document QA
          </h1>
          <p className="text-muted-foreground text-sm">
            Upload a PDF and ask questions about your document.
          </p>
        </div>

        <DocumentWorkspace />
      </main>
    </div>
  );
}
