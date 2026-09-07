import { Fragment } from 'react';
import { Text, Linking, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme/theme';

/**
 * Minimal HTML renderer for task descriptions / comments coming from the web
 * rich-text editor. Handles paragraphs, line breaks, bold/italic/underline,
 * links and unordered/ordered lists. Anything it doesn't recognise degrades to
 * plain text.
 */

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&laquo;': '«',
  '&raquo;': '»',
};

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

// Tokenise into tags and text.
function tokenize(html) {
  const tokens = [];
  const re = /<\/?([a-z0-9]+)([^>]*)>/gi;
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index > last) tokens.push({ type: 'text', value: html.slice(last, m.index) });
    const raw = m[0];
    const name = m[1].toLowerCase();
    const closing = raw.startsWith('</');
    const selfClose = raw.endsWith('/>') || name === 'br' || name === 'img' || name === 'hr';
    const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(m[2] || '');
    tokens.push({ type: closing ? 'close' : 'open', name, selfClose, href: hrefMatch?.[1] });
    last = re.lastIndex;
  }
  if (last < html.length) tokens.push({ type: 'text', value: html.slice(last) });
  return tokens;
}

const INLINE = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'a', 'span']);
const BLOCK = new Set(['p', 'div', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'blockquote']);

function styleFor(name) {
  switch (name) {
    case 'b':
    case 'strong':
      return { fontFamily: fontFamily.semiBold };
    case 'i':
    case 'em':
      return { fontStyle: 'italic' };
    case 'u':
      return { textDecorationLine: 'underline' };
    case 's':
    case 'strike':
      return { textDecorationLine: 'line-through' };
    case 'a':
      return { color: colors.primary, textDecorationLine: 'underline' };
    default:
      return null;
  }
}

export default function RichText({ html, style }) {
  if (!html || typeof html !== 'string') return null;

  const tokens = tokenize(html);
  const blocks = []; // array of arrays of inline React nodes
  let current = [];
  const inlineStack = [];
  let listCounter = [];
  let key = 0;

  const pushBlock = () => {
    if (current.length) blocks.push(current);
    current = [];
  };

  for (const tk of tokens) {
    if (tk.type === 'text') {
      const text = decodeEntities(tk.value).replace(/\s+/g, ' ');
      if (!text) continue;
      if (inlineStack.length) {
        let node = text;
        for (let i = inlineStack.length - 1; i >= 0; i--) {
          const frame = inlineStack[i];
          node = (
            <Text
              key={`t${key++}`}
              style={styleFor(frame.name)}
              onPress={frame.name === 'a' && frame.href ? () => Linking.openURL(frame.href) : undefined}
            >
              {node}
            </Text>
          );
        }
        current.push(node);
      } else {
        current.push(<Fragment key={`f${key++}`}>{text}</Fragment>);
      }
      continue;
    }

    if (tk.name === 'br') {
      current.push(<Fragment key={`f${key++}`}>{'\n'}</Fragment>);
      continue;
    }

    if (tk.type === 'open') {
      if (INLINE.has(tk.name)) {
        inlineStack.push({ name: tk.name, href: tk.href });
      } else if (BLOCK.has(tk.name)) {
        pushBlock();
        if (tk.name === 'ul') listCounter.push(null);
        if (tk.name === 'ol') listCounter.push(1);
        if (tk.name === 'li') {
          const top = listCounter[listCounter.length - 1];
          if (typeof top === 'number') {
            current.push(<Fragment key={`f${key++}`}>{`${top}. `}</Fragment>);
            listCounter[listCounter.length - 1] = top + 1;
          } else {
            current.push(<Fragment key={`f${key++}`}>{'•  '}</Fragment>);
          }
        }
      }
      continue;
    }

    if (tk.type === 'close') {
      if (INLINE.has(tk.name)) {
        for (let i = inlineStack.length - 1; i >= 0; i--) {
          if (inlineStack[i].name === tk.name) {
            inlineStack.splice(i, 1);
            break;
          }
        }
      } else if (BLOCK.has(tk.name)) {
        pushBlock();
        if (tk.name === 'ul' || tk.name === 'ol') listCounter.pop();
      }
    }
  }
  pushBlock();

  const rendered = blocks.filter((b) => b.length);
  if (!rendered.length) return null;

  return (
    <Text style={[styles.base, style]}>
      {rendered.map((nodes, i) => (
        <Fragment key={`b${i}`}>
          {i > 0 ? '\n\n' : ''}
          {nodes}
        </Fragment>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text2,
    lineHeight: 20,
  },
});
