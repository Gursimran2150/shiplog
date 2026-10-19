import { SECTION_LABELS, SECTIONS, type Entry } from "@/lib/domain/types";

/** The whole journal as portable Markdown, newest day first. */
export function journalToMarkdown(name: string, entries: readonly Entry[]): string {
  const blocks = entries.map((e) => {
    const sections = SECTIONS.filter((s) => e.data[s].length).map(
      (s) =>
        `### ${SECTION_LABELS[s]}\n${e.data[s].map((i) => `- ${i.text}${i.project ? ` _(${i.project})_` : ""}`).join("\n")}`,
    );
    return `## ${e.date}\n\n${e.data.summary}\n\n${sections.join("\n\n")}\n\n> ${e.raw.replaceAll("\n", " ")}`;
  });
  return `# ShipLog journal: ${name}\n\n${entries.length} entries\n\n${blocks.join("\n\n---\n\n")}\n`;
}
