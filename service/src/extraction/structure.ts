export type StructuredSection = {
    heading: string;
    level: number;
    body: string;
    children: StructuredSection[];
};

const HEADING_LINE = /^(#{1,6})\s*(.*)$/;

function stripHeadingMarkup(text: string): string {
    // Headings are often wrapped in bold markers, e.g. "## **General**".
    return text.replace(/\*\*/g, "").trim();
}

function joinBody(lines: string[]): string {
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Parses cleaned markdown (see preClean.ts) into a heading tree of arbitrary
 * depth. Source documents are hand-authored templates and routinely contain
 * empty headings (Google Docs page-break artifacts) and sections with no body
 * (unfilled template placeholders) — both are tolerated rather than treated
 * as errors.
 */
export function parseStructure(cleaned: string): StructuredSection {
    const root: StructuredSection = { heading: "", level: 0, body: "", children: [] };
    const stack: StructuredSection[] = [root];
    let bodyLines: string[] = [];

    const flushBody = () => {
        const current = stack[stack.length - 1]!;
        current.body = joinBody([current.body, ...bodyLines].filter(Boolean));
        bodyLines = [];
    };

    for (const line of cleaned.split("\n")) {
        const match = line.match(HEADING_LINE);
        if (!match) {
            bodyLines.push(line);
            continue;
        }

        const level = match[1]!.length;
        const heading = stripHeadingMarkup(match[2]!);

        // Empty headings carry no content of their own (Google Docs page-break
        // artifacts) — treat the line as a blank rather than opening a new section.
        if (!heading) {
            bodyLines.push("");
            continue;
        }

        flushBody();

        while (stack.length > 1 && stack[stack.length - 1]!.level >= level) {
            stack.pop();
        }

        const section: StructuredSection = { heading, level, body: "", children: [] };
        stack[stack.length - 1]!.children.push(section);
        stack.push(section);
    }

    flushBody();

    return root;
}

export type FlatSection = { heading: string; body: string };

/** Flattens a heading tree into the {heading, body} shape the entity models store. */
export function flattenSections(section: StructuredSection): FlatSection[] {
    const flat: FlatSection[] = [];

    for (const child of section.children) {
        flat.push({ heading: child.heading, body: child.body });
        flat.push(...flattenSections(child));
    }

    return flat;
}
