/** Fetches a Google Doc as markdown via its public export URL — no Google sign-in involved. */

const ID_PATTERNS = [/\/document\/d\/([a-zA-Z0-9_-]+)/, /\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];

export function extractGoogleDocId(url: string): string | null {
    for (const pattern of ID_PATTERNS) {
        const match = url.match(pattern);
        if (match) return match[1]!;
    }
    return null;
}

const NOT_SHARED =
    'The document isn\'t publicly readable. In Google Docs, set sharing to "Anyone with the link can view" and try again.';

export async function fetchGoogleDocMarkdown(url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
    const id = extractGoogleDocId(url.trim());
    if (!id) {
        throw new Error(
            "That doesn't look like a Google Docs link. Expected something like https://docs.google.com/document/d/<id>/edit",
        );
    }

    let response: Response;
    try {
        response = await fetchImpl(`https://docs.google.com/document/d/${id}/export?format=md`, { redirect: "follow" });
    } catch (error) {
        throw new Error(`Couldn't reach Google Docs: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (response.status === 404) throw new Error("Google Docs says that document doesn't exist (404). Check the link.");
    if (response.status === 401 || response.status === 403) throw new Error(NOT_SHARED);
    if (!response.ok) throw new Error(`Google Docs export failed: ${response.status} ${response.statusText}`);

    // Private documents redirect to a Google sign-in page, which arrives as a 200 HTML response.
    const contentType = response.headers.get("content-type") ?? "";
    if (response.url.includes("accounts.google.com") || contentType.includes("text/html")) {
        throw new Error(NOT_SHARED);
    }

    const markdown = await response.text();
    if (!markdown.trim()) throw new Error("The Google Doc is empty.");
    return markdown;
}
