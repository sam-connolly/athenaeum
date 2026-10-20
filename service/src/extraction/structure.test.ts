import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStructure, flattenSections } from "./structure.ts";

test("parses nested headings of arbitrary depth", () => {
    const md = [
        "# Chapter Information",
        "",
        "## General",
        "",
        "### Name:",
        "",
        "Dreadbringers",
        "",
        "## Homeworld",
        "",
        "Some homeworld text.",
    ].join("\n");

    const tree = parseStructure(md);
    assert.equal(tree.children.length, 1);
    const chapterInfo = tree.children[0]!;
    assert.equal(chapterInfo.heading, "Chapter Information");
    assert.equal(chapterInfo.children.length, 2);

    const general = chapterInfo.children[0]!;
    assert.equal(general.heading, "General");
    assert.equal(general.children[0]!.heading, "Name:");
    assert.equal(general.children[0]!.body, "Dreadbringers");

    const homeworld = chapterInfo.children[1]!;
    assert.equal(homeworld.heading, "Homeworld");
    assert.equal(homeworld.body, "Some homeworld text.");
});

test("tolerates empty headings as page-break noise, not new sections", () => {
    const md = ["# Real Section", "content", "# ", "# ", "## Next Section", "more content"].join(
        "\n",
    );
    const tree = parseStructure(md);
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0]!.heading, "Real Section");
    assert.equal(tree.children[0]!.children.length, 1);
    assert.equal(tree.children[0]!.children[0]!.heading, "Next Section");
});

test("tolerates sections with no body (unfilled template placeholders)", () => {
    const md = ["## Empty Section", "", "## Another Empty", "", "## Filled", "has content"].join(
        "\n",
    );
    const tree = parseStructure(md);
    assert.equal(tree.children[0]!.body, "");
    assert.equal(tree.children[1]!.body, "");
    assert.equal(tree.children[2]!.body, "has content");
});

test("flattenSections produces heading/body pairs for the whole tree", () => {
    const md = ["# A", "a-body", "## B", "b-body"].join("\n");
    const flat = flattenSections(parseStructure(md));
    assert.deepEqual(flat, [
        { heading: "A", body: "a-body" },
        { heading: "B", body: "b-body" },
    ]);
});

test("strips bold markup from heading text", () => {
    const md = "## **General**\n\nsome text";
    const tree = parseStructure(md);
    assert.equal(tree.children[0]!.heading, "General");
});
