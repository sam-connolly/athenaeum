export type OpenQuestion = {
    type: "TODO" | "IDEA";
    text: string;
};

export type PreCleanResult = {
    cleaned: string;
    openQuestions: OpenQuestion[];
};

// Google Docs exports images as a placeholder reference (`![][image1]`) plus a
// link-style definition holding the actual base64 payload (`[image1]: <data:...>`).
// Neither carries text content, so both are dropped until real image support exists.
const IMAGE_DEFINITION = /^\[image\d+\]:\s*<data:[^>]*>\s*$/gim;
const IMAGE_REFERENCE = /!\[\]\[image\d+\]/g;

// Google's auto-generated table of contents is a run of `[Heading   N](#anchor)`
// links with no lore content, plus the "Contents" heading that introduces it.
// Anchors can themselves contain escaped parentheses (e.g. "#location\(s\)-of..."),
// so the closing paren is matched greedily against the end of the line, not the
// first ")" encountered.
const TOC_ENTRY_LINE = /^\[.+?\]\(#.+\)\s*$/gm;
const CONTENTS_HEADING = /^#+\s*\**Contents\**\s*(\{#contents\})?\s*$/gim;

// Headings carry a Google anchor id, e.g. "## **General** {#general}".
const HEADING_ANCHOR = /\s*\{#[^}]*\}\s*$/gm;

// Authoring-template placeholders left unfilled, e.g.
// "(who is the chief librarian)\[as leader of the librarius...\]".
const TEMPLATE_INSTRUCTION = /\([^()]*\)\\?\[[^\]]*\\?\]/g;

const OPEN_QUESTION_MARKER = /\\?<(TODO|IDEA):\s*([^>]*?)\s*\\?>/gi;

function extractOpenQuestions(text: string): { text: string; openQuestions: OpenQuestion[] } {
    const openQuestions: OpenQuestion[] = [];

    const withoutMarkers = text.replace(OPEN_QUESTION_MARKER, (_match, type, body) => {
        openQuestions.push({
            type: type.toUpperCase() as "TODO" | "IDEA",
            text: body.trim(),
        });
        return "";
    });

    return { text: withoutMarkers, openQuestions };
}

function collapseBlankLines(text: string): string {
    return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function preClean(raw: string): PreCleanResult {
    let text = raw;

    text = text.replace(IMAGE_DEFINITION, "");
    text = text.replace(IMAGE_REFERENCE, "");
    text = text.replace(CONTENTS_HEADING, "");
    text = text.replace(TOC_ENTRY_LINE, "");
    text = text.replace(HEADING_ANCHOR, "");
    text = text.replace(TEMPLATE_INSTRUCTION, "");

    const { text: withoutQuestions, openQuestions } = extractOpenQuestions(text);
    text = withoutQuestions;

    text = collapseBlankLines(text);

    return { cleaned: text, openQuestions };
}
