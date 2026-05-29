window.Slab = window.Slab || {};

(function (Slab) {
  // Map of HTML inline tags → Markdown equivalents
  const INLINE_MAP = [
    [/<strong>([\s\S]*?)<\/strong>/gi, '**$1**'],
    [/<b>([\s\S]*?)<\/b>/gi, '**$1**'],
    [/<em>([\s\S]*?)<\/em>/gi, '*$1*'],
    [/<i>([\s\S]*?)<\/i>/gi, '*$1*'],
    [/<code>([\s\S]*?)<\/code>/gi, '`$1`'],
    [/<br\s*\/?>/gi, '\n'],
    [/<[^>]+>/g, ''], // strip remaining tags
  ];

  function htmlToMd(html) {
    let md = html;
    INLINE_MAP.forEach(([pattern, replacement]) => {
      md = md.replace(pattern, replacement);
    });
    // Decode common HTML entities
    md = md
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    return md.trim();
  }

  function blocksToMarkdown(title, blocks) {
    const lines = [];
    if (title) lines.push(`# ${title}`, '');

    blocks.forEach((block) => {
      switch (block.type) {
        case 'paragraph':
          lines.push(htmlToMd(block.content), '');
          break;
        case 'heading1':
          lines.push(`# ${htmlToMd(block.content)}`, '');
          break;
        case 'heading2':
          lines.push(`## ${htmlToMd(block.content)}`, '');
          break;
        case 'heading3':
          lines.push(`### ${htmlToMd(block.content)}`, '');
          break;
        case 'callout':
          lines.push(`> ${htmlToMd(block.content)}`, '');
          break;
        case 'code': {
          const lang = block.lang || '';
          lines.push(`\`\`\`${lang}`, block.content, '```', '');
          break;
        }
        case 'checklist':
          lines.push(`- [${block.checked ? 'x' : ' '}] ${htmlToMd(block.content)}`, '');
          break;
        case 'divider':
          lines.push('---', '');
          break;
        default:
          lines.push(htmlToMd(block.content || ''), '');
      }
    });

    return lines.join('\n');
  }

  function download(title, blocks) {
    const md = blocksToMarkdown(title, blocks);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  Slab.export = { download, blocksToMarkdown };
})(window.Slab);
