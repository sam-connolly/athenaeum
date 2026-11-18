import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNameIndex, findByName, normalizeName, type KnownEntity } from "./matching.ts";

test("normalizeName ignores case, accents, apostrophes and punctuation", () => {
    assert.equal(normalizeName("  Ind’ar  Manutec "), "indar manutec");
    assert.equal(normalizeName("Ahzek AHRIMAN"), "ahzek ahriman");
    assert.equal(normalizeName("Éowyn-of Rohan"), "eowyn of rohan");
});

const known: KnownEntity[] = [
    { id: "c1", type: "character", name: "Orasmyn", aliases: ["Sorcerer Lord Orasmyn"] },
    { id: "f1", type: "faction", name: "Scions of Erudition", aliases: [] },
    { id: "f2", type: "faction", name: "Orasmyn", aliases: [] },
];

test("findByName matches names and aliases within the same type only", () => {
    const index = buildNameIndex(known);
    assert.equal(findByName(index, "character", ["sorcerer lord orasmyn"])?.id, "c1");
    assert.equal(findByName(index, "character", ["Orasmyn"])?.id, "c1");
    assert.equal(findByName(index, "faction", ["Orasmyn"])?.id, "f2");
    assert.equal(findByName(index, "place", ["Orasmyn"]), null);
});

test("findByName tries each candidate name in order", () => {
    const index = buildNameIndex(known);
    assert.equal(findByName(index, "faction", ["Unknown", "scions of erudition"])?.id, "f1");
});
