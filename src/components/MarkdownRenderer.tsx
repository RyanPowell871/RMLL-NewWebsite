import React from 'react';

// Simple markdown renderer for links and auto-linking URLs
// Converts [text](url) and [text](url "target") to HTML links
// Also auto-links plain URLs like https://example.com
export function MarkdownRenderer({ content }: { content?: string }) {
  if (!content) return <span className="text-gray-400 italic">No content yet...</span>;

  // Parse markdown links: [text](url) or [text](url "target")
  // Also auto-link plain URLs: https://example.com or http://example.com
  const renderMarkdown = (text: string): React.ReactNode => {
    // First, find all markdown links and their positions
    const linkRegex = /\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]+)")?\)/g;
    const linkMatches: Array<{ start: number; end: number; text: string; url: string; target: string }> = [];

    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      linkMatches.push({
        start: match.index,
        end: linkRegex.lastIndex,
        text: match[1],
        url: match[2],
        target: match[3] || '',
      });
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Process text between markdown links
    linkMatches.forEach(linkMatch => {
      // Add text before this link
      const beforeText = text.substring(lastIndex, linkMatch.start);
      if (beforeText) {
        parts.push(...autoLinkUrls(beforeText));
      }

      // Add the markdown link
      parts.push(
        <a
          key={`link-${linkMatch.start}`}
          href={linkMatch.url}
          target={linkMatch.target === '_blank' ? '_blank' : undefined}
          rel={linkMatch.target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-[#013fac] hover:text-[#003399] underline"
        >
          {linkMatch.text}
        </a>
      );

      lastIndex = linkMatch.end;
    });

    // Add remaining text after the last link
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(...autoLinkUrls(remainingText));
      }
    }

    return parts.length > 0 ? parts : autoLinkUrls(text);
  };

  // Auto-link plain URLs (https:// or http://)
  const autoLinkUrls = (text: string): React.ReactNode[] => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const url = match[1];
      parts.push(
        <a
          key={`url-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#013fac] hover:text-[#003399] underline"
        >
          {url}
        </a>
      );

      lastIndex = urlRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Handle line breaks (convert \n to <br />)
  const renderWithLineBreaks = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {renderMarkdown(line)}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return <>{renderWithLineBreaks(content)}</>;
}