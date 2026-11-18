import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExtractedEntity } from "../ai/extractEntities.ts";
import type { KnownEntity } from "./matching.ts";
import { resolveProposals } from "./pipeline.ts";

const base = { summary: "", role: null, placeType: null, date: null, factionName: null, matchId: null };
const entity = (overrides: Partial<ExtractedEntity>): ExtractedEntity =>
    ({ type: "character", name: "", aliases: [], ...base, ...overrides }) as ExtractedEntity;

const known: KnownEntity[] = [
    { id: "c1", type: "character", name: "Orasmyn", aliases: [] },
    { id: "f1", type: "faction", name: "Thousand Sons", aliases: ["XVth Legion"] },
];

test("an exact name or alias match wins and is reported as a name match", () => {
    const [proposal] = resolveProposals([entity({ name: "Sorcerer Lord Orasmyn", aliases: ["Orasmyn"] })], known);
    assert.equal(proposal!.existingId, "c1");
    assert.equal(proposal!.matchedBy, "name");
});

test("Claude's match is used only for a real id of the same type", () => {
    const [good, wrongType, bogus] = resolveProposals(
        [
            entity({ name: "The Exiled Sorcerer", matchId: "c1" }),
            entity({ name: "Some Place", type: "place", matchId: "c1" }),
            entity({ name: "Nobody", matchId: "does-not-exist" }),
        ],
        known,
    );
    assert.deepEqual([good!.existingId, good!.matchedBy], ["c1", "ai"]);
    assert.equal(wrongType!.existingId, null);
    assert.equal(bogus!.existingId, null);
});

test("duplicate extractions of one entity are merged, aliases combined", () => {
    const proposals = resolveProposals(
        [
            entity({ name: "Vizaresh Nas", aliases: ["Nas"] }),
            entity({ name: "vizaresh nas", aliases: ["The Telekine"] }),
        ],
        known,
    );
    assert.equal(proposals.length, 1);
    assert.deepEqual(proposals[0]!.aliases, ["Nas", "The Telekine"]);
});

test("the name itself is not kept as an alias, and every proposal gets a key", () => {
    const [proposal] = resolveProposals([entity({ name: "Haruvatat", aliases: ["haruvatat", "Haru"] })], known);
    assert.deepEqual(proposal!.aliases, ["Haru"]);
    assert.ok(proposal!.key);
    assert.equal("matchId" in proposal!, false);
});
