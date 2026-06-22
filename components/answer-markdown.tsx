import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AnswerMarkdownProps = {
  content: string;
};

function stripInlineCitations(content: string) {
  const normalized = content.replace(/［/g, "[").replace(/］/g, "]");

  return normalized
    .replace(/\s*(?:\[(?:\d+\s*[,，]\s*)*\d+\])+/g, "")
    .replace(/\s+([。，、；：！？])/g, "$1")
    .trim();
}

export function AnswerMarkdown({ content }: AnswerMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-2 pl-5">{children}</ol>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-2 pl-5">{children}</ul>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
      }}
    >
      {stripInlineCitations(content)}
    </ReactMarkdown>
  );
}
