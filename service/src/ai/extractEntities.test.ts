import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUserMessage, extractEntities, MODEL, type ExtractionClient } from "./extractEntities.ts";

/** A stand-in for the Anthropic client that records the request and returns a canned message. */
function fakeClient(message: Record<string, unknown>) {
    const calls: Record<string, unknown>[] = [];
    const client = {
        beta: {
            messages: {
                stream: (params: Record<string, unknown>) => {
                    calls.push(params);
                    return { finalMessage: async () => message };
                },
            },
        },
    } as unknown as ExtractionClient;
    return { client, calls };
}

const entities = [{ type: "character", name: "Orasmyn", aliases: [], summary: "", role: null, placeType: null, date: null, factionName: null, matchId: null }];

test("returns the parsed entities and sends the document with known entities", async () => {
    const { client, calls } = fakeClient({ stop_reason: "end_turn", parsed_output: { entities } });
    const result = await extractEntities("Orasmyn leads.", [{ id: "x1", type: "faction", name: "Scions", aliases: [] }], client);

    assert.deepEqual(result, entities);
    assert.equal(calls[0]!.model, MODEL);
    const content = (calls[0]!.messages as { content: string }[])[0]!.content;
    assert.match(content, /id=x1 type=faction name="Scions"/);
    assert.match(content, /<document>\nOrasmyn leads\.\n<\/document>/);
});

test("turns a refusal into a readable error", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", stop_details: { explanation: "policy" }, parsed_output: null });
    await assert.rejects(extractEntities("x", [], client), /declined to process this document: policy/);
});

test("reports truncated output instead of returning partial data", async () => {
    const { client } = fakeClient({ stop_reason: "max_tokens", parsed_output: null });
    await assert.rejects(extractEntities("x", [], client), /too long/);
});

test("buildUserMessage says when nothing is known yet", () => {
    assert.match(buildUserMessage("doc", []), /KNOWN ENTITIES:\n\(none yet\)/);
});
