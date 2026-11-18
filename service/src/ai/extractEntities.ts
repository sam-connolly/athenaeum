import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { KnownEntity } from "../import/matching.ts";

export const MODEL = "claude-opus-5-5";

// Every field is required (nullable where it may be absent) so the structured
// output schema is unambiguous for the model.
const ExtractedEntity = z.object({
    type: z.enum(["faction", "character", "place", "battle"]),
    name: z.string().describe("The entity's fullest proper name as used in the document."),
    aliases: z.array(z.string()).describe("Other names, titles-with-name or short forms used for it in the document."),
    summary: z.string().describe("One or two factual sentences drawn only from the document."),
    role: z.string().nullable().describe("Characters only: rank, title or role. Null otherwise or if unknown."),
    placeType: z
        .enum(["homeworld", "fortress_monastery", "ship", "other"])
        .nullable()
        .describe("Places only. Null for other entity types."),
    date: z.string().nullable().describe("Battles only: the in-universe date as written (e.g. 745.M41), or null."),
    factionName: z
        .string()
        .nullable()
        .describe("Name of the faction this character, place or battle belongs to or involves, as written. Null if none."),
    matchId: z
        .string()
        .nullable()
        .describe("The id of a KNOWN ENTITY that is the same entity, or null if it is new or you are unsure."),
});

const ExtractionResult = z.object({
    entities: z.array(ExtractedEntity),
});

export type ExtractedEntity = z.infer<typeof ExtractedEntity>;

const SYSTEM_PROMPT = `You index lore documents for a Warhammer (40k and Horus Heresy) homebrew wiki.

From the document, list every named entity of these four types:
- faction: chapters, legions, warbands, cabals, cults, orders, armies and other organisations.
- character: named individuals.
- place: named planets, fortress-monasteries, ships, cities and other locations.
- battle: named battles, sieges, campaigns and massacres.

Rules:
- Only named entities. Skip generic groups ("the marines", "his company") and unnamed people.
- Include canon entities the document mentions (e.g. Magnus the Red, the Thousand Sons), not only homebrew ones.
- One entry per real-world entity: if the document uses several names for the same one, use the fullest as "name" and list the others in "aliases".
- Summaries must only state what this document says.
- You are given KNOWN ENTITIES already in the wiki. Set "matchId" to a known entity's id only when you are confident it is the same entity (e.g. "Sorcerer Lord Orasmyn" and "Orasmyn"), and of the same type. Otherwise null.`;

function formatKnown(known: KnownEntity[]): string {
    if (!known.length) return "(none yet)";
    return known
        .map((e) => `- id=${e.id} type=${e.type} name="${e.name}"${e.aliases.length ? ` aliases=${JSON.stringify(e.aliases)}` : ""}`)
        .join("\n");
}

export function buildUserMessage(documentText: string, known: KnownEntity[]): string {
    return `KNOWN ENTITIES:\n${formatKnown(known)}\n\nDOCUMENT:\n<document>\n${documentText}\n</document>`;
}

/** The part of the SDK client this module uses, so tests can pass a fake. */
export type ExtractionClient = Pick<Anthropic, "beta">;

let defaultClient: Anthropic | null = null;
function getClient(): Anthropic {
    // Created lazily so the service starts without credentials; only imports need them.
    defaultClient ??= new Anthropic();
    return defaultClient;
}

export async function extractEntities(
    documentText: string,
    known: KnownEntity[],
    client: ExtractionClient = getClient(),
): Promise<ExtractedEntity[]> {
    let message;
    try {
        // Streamed because lore documents can be long; finalMessage() collects the result.
        const stream = client.beta.messages.stream({
            model: MODEL,
            max_tokens: 64000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "medium", format: betaZodOutputFormat(ExtractionResult) },
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildUserMessage(documentText, known) }],
        });
        message = await stream.finalMessage();
    } catch (error) {
        if (error instanceof Anthropic.AuthenticationError) {
            throw new Error("AI extraction failed: the service has no valid Anthropic API key (set ANTHROPIC_API_KEY).");
        }
        if (error instanceof Anthropic.RateLimitError) {
            throw new Error("AI extraction is rate limited right now. Wait a minute and try again.");
        }
        if (error instanceof Anthropic.APIError) {
            throw new Error(`AI extraction failed (${error.status ?? "no status"}): ${error.message}`);
        }
        // Errors raised before any request is sent are client set-up problems, most often missing credentials.
        if (error instanceof Anthropic.AnthropicError) {
            throw new Error(
                `AI extraction isn't set up: ${error.message}. Set ANTHROPIC_API_KEY in service/.env and restart the service.`,
            );
        }
        throw error;
    }

    if (message.stop_reason === "refusal") {
        const why = message.stop_details?.explanation;
        throw new Error(`The AI declined to process this document${why ? `: ${why}` : "."}`);
    }
    if (message.stop_reason === "max_tokens") {
        throw new Error("The document is too long for a single AI extraction. Try importing it in parts.");
    }
    if (!message.parsed_output) {
        throw new Error("The AI response couldn't be read as entity data. Try the import again.");
    }
    return message.parsed_output.entities;
}
