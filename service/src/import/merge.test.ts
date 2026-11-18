import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMergeUpdate } from "./merge.ts";

const proposal = {
    name: "Sorcerer Lord Orasmyn",
    aliases: ["Orasmyn", "The Exile"],
    summary: "Leader of the Scions of Erudition.",
    role: "Sorcerer Lord",
};

test("keeps existing values and only fills empty fields", () => {
    const update = buildMergeUpdate(
        "character",
        { name: "Orasmyn", aliases: [], summary: "Already written.", role: "" },
        proposal,
        "doc1",
    );
    assert.deepEqual(update.$set, { aliases: ["Sorcerer Lord Orasmyn", "The Exile"], role: "Sorcerer Lord" });
    assert.deepEqual(update.$addToSet, { sourceDocumentIds: "doc1" });
});

test("adds no $set when there is nothing new", () => {
    const update = buildMergeUpdate(
        "character",
        { name: "Sorcerer Lord Orasmyn", aliases: ["orasmyn", "the exile"], summary: "x", role: "y" },
        proposal,
        "doc1",
    );
    assert.equal("$set" in update, false);
});

test("links a faction only when none is set, and adds factions to battles", () => {
    const linked = buildMergeUpdate("character", { name: "A", factionId: "old" }, { ...proposal, name: "A" }, "d", "new");
    assert.equal((linked.$set as Record<string, unknown> | undefined)?.factionId, undefined);

    const unlinked = buildMergeUpdate("character", { name: "A" }, { ...proposal, name: "A" }, "d", "new");
    assert.equal((unlinked.$set as Record<string, unknown>).factionId, "new");

    const battle = buildMergeUpdate("battle", { name: "B" }, { name: "B", aliases: [], summary: "" }, "d", "f1");
    assert.equal(battle.$addToSet.factionIds, "f1");
});

test("upgrades a place type only from 'other'", () => {
    const fromOther = buildMergeUpdate("place", { name: "P", type: "other" }, { name: "P", aliases: [], summary: "", placeType: "ship" }, "d");
    assert.equal((fromOther.$set as Record<string, unknown>).type, "ship");
    const fromSet = buildMergeUpdate("place", { name: "P", type: "homeworld" }, { name: "P", aliases: [], summary: "", placeType: "ship" }, "d");
    assert.equal(fromSet.$set, undefined);
});
