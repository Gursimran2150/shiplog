import { Fragment, memo, useMemo, type ReactNode } from "react";

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "para"; text: string }
  | { kind: "rule" };

/** Splits model output into blocks. Supports headings, bullet/numbered lists, rules and paragraphs. */
export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "para", text: para.join("\n") });
    para = [];
  };

  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const item = bullet?.[1] ?? numbered?.[1];

    if (!line.trim()) {
      flush();
    } else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flush();
      blocks.push({ kind: "rule" });
    } else if (heading) {
      flush();
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
    } else if (item !== undefined) {
      flush();
      const ordered = Boolean(numbered);
      const last = blocks.at(-1);
      if (last?.kind === "list" && last.ordered === ordered) last.items.push(item);
      else blocks.push({ kind: "list", ordered, items: [item] });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|(?<![\w*])_[^_\n]+_(?!\w)|`[^`\n]+`)/g;
const LINK = /^\[([^\]\n]+)\]\(([^)\s]+)\)$/;

/** Only absolute https URLs become links; anything else (javascript:, data:, relative) stays plain text. */
function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Renders **bold**, _italic_, `code` and [label](https://…) links as React nodes (no HTML injection). */
function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = LINK.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      return href ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {link[1]}
        </a>
      ) : (
        <Fragment key={i}>{link[1]}</Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Memoised: past chat messages don't re-render, and parsing only reruns when the text changes. */
export const SimpleMarkdown = memo(function SimpleMarkdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return (
    <div className="flex flex-col gap-3 text-[0.975rem] leading-7 break-words">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading": {
            // Generated text sits under the page's own h1/h2, so its headings start at h3.
            const Heading = block.level === 1 ? "h3" : "h4";
            return (
              <Heading
                key={i}
                className={
                  block.level === 1
                    ? "pt-1 text-lg font-semibold tracking-tight sm:text-xl"
                    : "pt-1 text-base font-semibold tracking-tight sm:text-lg"
                }
              >
                {inline(block.text)}
              </Heading>
            );
          }
          case "rule":
            return <hr key={i} className="my-1 border-border" />;
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={i}
                className={`flex flex-col gap-1.5 pl-6 marker:font-semibold marker:text-primary ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    {inline(item)}
                  </li>
                ))}
              </List>
            );
          }
          default:
            return (
              <p key={i} className="whitespace-pre-wrap">
                {inline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
});
