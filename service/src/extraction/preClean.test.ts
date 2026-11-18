import { test } from "node:test";
import assert from "node:assert/strict";
import { preClean } from "./preClean.ts";

test("strips image definitions and references", () => {
    const raw = "Before\n![][image1]\nAfter\n\n[image1]: <data:image/png;base64,AAAA>\n";
    const { cleaned } = preClean(raw);
    assert.ok(!cleaned.includes("image1"));
    assert.ok(cleaned.includes("Before"));
    assert.ok(cleaned.includes("After"));
});

test("strips Google TOC block including anchors with escaped parens", () => {
    const raw = [
        "# Contents {#contents}",
        "",
        "[Location(s) of recruitment:\t14](#location\\(s\\)-of-recruitment:)",
        "",
        "# Real Heading {#real-heading}",
        "",
        "Actual content.",
    ].join("\n");
    const { cleaned } = preClean(raw);
    assert.ok(!cleaned.includes("Contents"));
    assert.ok(!cleaned.includes("location\\(s\\)"));
    assert.ok(cleaned.includes("Real Heading"));
    assert.ok(!cleaned.includes("{#real-heading}"));
    assert.ok(cleaned.includes("Actual content."));
});

test("strips unfilled template-instruction placeholders", () => {
    const raw =
        "Psychic Artefacts:  (list and explanation of psychic artefacts possessed by the Chapter)\\[any special force weapons\\]";
    const { cleaned } = preClean(raw);
    assert.equal(cleaned, "Psychic Artefacts:");
});

test("extracts TODO and IDEA markers into open questions and removes them from body", () => {
    const raw = "Some lore.\n\\<TODO: figure out the ending\\>\nMore lore.\n\\<IDEA: maybe a twist\\>";
    const { cleaned, openQuestions } = preClean(raw);
    assert.deepEqual(openQuestions, [
        { type: "TODO", text: "figure out the ending" },
        { type: "IDEA", text: "maybe a twist" },
    ]);
    assert.ok(!cleaned.includes("TODO"));
    assert.ok(!cleaned.includes("IDEA"));
    assert.ok(cleaned.includes("Some lore."));
    assert.ok(cleaned.includes("More lore."));
});

test("lists a repeated open question once and removes markdown escapes from it", () => {
    const raw = "A <TODO: appeared atop \\<Mountain name> B <TODO: appeared atop \\<Mountain name> C <IDEA: other>";
    const { openQuestions } = preClean(raw);
    assert.deepEqual(openQuestions, [
        { type: "TODO", text: "appeared atop <Mountain name" },
        { type: "IDEA", text: "other" },
    ]);
});
