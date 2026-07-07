'use client';

import { useMemo } from 'react';

interface SearchHighlightProps {
  text: string;
  query: string;
  className?: string;
}

export function SearchHighlight({
  text,
  query,
  className,
}: SearchHighlightProps) {
  const highlightedText = useMemo(() => {
    if (!query.trim()) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add highlighted match
      parts.push(
        <mark
          key={match.index}
          className="bg-yellow-200 text-inherit px-0.5 rounded"
        >
          {match[0]}
        </mark>,
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }, [text, query]);

  return <span className={className}>{highlightedText}</span>;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
