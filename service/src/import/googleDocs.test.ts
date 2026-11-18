import { test } from "node:test";
import assert from "node:assert/strict";
import { extractGoogleDocId, fetchGoogleDocMarkdown } from "./googleDocs.ts";

test("extracts the document id from the common link shapes", () => {
    assert.equal(extractGoogleDocId("https://docs.google.com/document/d/abc_123-X/edit?tab=t.0"), "abc_123-X");
    assert.equal(extractGoogleDocId("https://drive.google.com/file/d/xyz/view"), "xyz");
    assert.equal(extractGoogleDocId("https://drive.google.com/open?id=qq9"), "qq9");
    assert.equal(extractGoogleDocId("https://example.com/nothing"), null);
});

const respond = (body: string, init: ResponseInit & { url?: string } = {}) =>
    (async () => {
        const response = new Response(body, init);
        Object.defineProperty(response, "url", { value: init.url ?? "https://docs.google.com/export" });
        return response;
    }) as unknown as typeof fetch;

test("returns the markdown export", async () => {
    const md = await fetchGoogleDocMarkdown(
        "https://docs.google.com/document/d/abc/edit",
        respond("# Title", { headers: { "content-type": "text/markdown" } }),
    );
    assert.equal(md, "# Title");
});

test("explains sharing when Google redirects to sign-in or refuses access", async () => {
    const url = "https://docs.google.com/document/d/abc/edit";
    await assert.rejects(
        fetchGoogleDocMarkdown(url, respond("<html>", { headers: { "content-type": "text/html" }, url: "https://accounts.google.com/x" })),
        /Anyone with the link can view/,
    );
    await assert.rejects(fetchGoogleDocMarkdown(url, respond("", { status: 403 })), /Anyone with the link can view/);
    await assert.rejects(fetchGoogleDocMarkdown(url, respond("", { status: 404 })), /doesn't exist/);
});
