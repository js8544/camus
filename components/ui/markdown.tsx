import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [processedContent, setProcessedContent] = useState(content);

  // Process the content to handle HTML and special blocks
  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      return;
    }

    let updatedContent = content;

    // Clean artifact blocks - these should be handled by the parent component
    if (updatedContent.includes("```artifact")) {
      updatedContent = updatedContent.replace(/```artifact\n[\s\S]*?\n```/g, '');
    }

    // Check if content contains HTML
    if (updatedContent && (
      updatedContent.includes("<!DOCTYPE html>") ||
      updatedContent.includes("<html") ||
      (updatedContent.includes("<head") && updatedContent.includes("</html>"))
    )) {
      // Try to extract just HTML comments and text outside the HTML tags
      const beforeHtml = updatedContent.split(/<!DOCTYPE html>|<html/i)[0].trim();
      const afterHtml = updatedContent.split(/<\/html>/i)[1] || '';

      // Combine text before and after HTML
      const nonHtmlContent = [beforeHtml, afterHtml].filter(Boolean).join('\n\n');

      if (nonHtmlContent) {
        setProcessedContent(nonHtmlContent || 'HTML content detected. Please view in iframe.');
      } else {
        setProcessedContent('HTML content detected. Please view in iframe.');
      }
    } else {
      setProcessedContent(updatedContent);
    }
  }, [content]);

  // No need to process artifact blocks here since they're handled at the message level
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-black mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-black mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-medium text-black mb-1">{children}</h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="text-black mb-2 leading-relaxed">{children}</p>
        ),
        // Code blocks
        code: ({ inline, className, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className="bg-gray-200 text-purple-700 px-1 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <code
              className="block bg-gray-100 text-black p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap break-all"
              {...props}
            >
              {children}
            </code>
          )
        },
        // Preformatted blocks
        pre: ({ children }) => (
          <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3 whitespace-pre-wrap">
            {children}
          </pre>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-black mb-2 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-black mb-2 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-black">{children}</li>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-taupe hover:text-taupe/80 underline"
          >
            {children}
          </a>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-taupe pl-4 italic text-gray-600 mb-2">
            {children}
          </blockquote>
        ),
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="min-w-full border-collapse border border-gray-300">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 px-3 py-2 bg-gray-100 text-left text-black font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-3 py-2 text-black">
            {children}
          </td>
        ),
        // Horizontal rule
        hr: () => <hr className="border-gray-300 my-4" />,
        // Strong/bold
        strong: ({ children }) => (
          <strong className="font-bold text-black">{children}</strong>
        ),
        // Emphasis/italic
        em: ({ children }) => (
          <em className="italic text-gray-700">{children}</em>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
} 
