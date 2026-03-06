// Лёгкий парсер markdown → структурированные блоки для AI-чата
// Поддержка: **bold**, *italic*, - bullet-списки, 1. нумерованные списки

export function parseMarkdown(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null;

  function flushList() {
    if (listItems.length > 0) {
      elements.push({ type: listType, items: [...listItems] });
      listItems = [];
      listType = null;
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Bullet list
    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    flushList();

    if (trimmed === '') {
      elements.push({ type: 'break' });
    } else {
      elements.push({ type: 'text', content: trimmed });
    }
  });

  flushList();
  return elements;
}

// Inline: **bold**, *italic*
export function formatInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      parts.push({ type: 'bold', content: match[2] });
    } else if (match[3]) {
      parts.push({ type: 'italic', content: match[3] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}
