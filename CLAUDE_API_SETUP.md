# Plan: connecting Athenaeum to the Claude API

The code already uses Claude for imports (see `service/src/ai/extractEntities.ts`). What's left is account set-up, plus one line of configuration. No code changes are needed.

## A Claude subscription is not API access

Claude Pro and Max plans cover claude.ai and Claude Code. They **do not** include API access. The API is a separate account in the Claude Console, billed pay-as-you-go from prepaid credits.

## How the connection works

```
Browser ──/graphql──▶ service (Node) ──HTTPS + API key──▶ Claude API
```

- Only the service talks to Claude. The browser never sees the API key.
- `service/src/ai/extractEntities.ts` calls Claude through the official SDK, `@anthropic-ai/sdk`.
- The SDK reads the key from `ANTHROPIC_API_KEY`.
- `npm run dev` in `service/` loads that variable from `service/.env`. Git ignores this file.
- If the key is missing, the app still works, except **Find entities**, which shows an error explaining how to set the key.

## Steps

- [ ] **1. Create an API account.** Sign in to the Claude Console at console.anthropic.com. You can use the same email as your subscription, but billing is separate.
- [ ] **2. Add credits and a spend limit.** Under Billing, buy some credits. Set a monthly spend limit so a mistake can't run up a large bill.
- [ ] **3. Create an API key.** Under API keys, create one. It starts with `sk-ant-` and is only shown once, so copy it straight away. Never commit it.
- [ ] **4. Put the key in the service's environment.** Copy the example file:
  ```bash
  cp service/.env.example service/.env
  ```
  Then edit `service/.env`:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] **5. Restart the service.** The `.env` file is only read at start-up.
  ```bash
  npm --prefix service run dev
  ```
- [ ] **6. Test a real import.** This is the one part of the flow that hasn't been run for real yet.
  1. In the app, click **Import → Paste text**, paste `tmp/Scions of Erudition.md`, then click **Find entities**. Review the list and click **Create page**. Expect the faction, Orasmyn and the inner circle.
  2. Import `tmp/Sorcerer Lord Orasmyn_ Profile.md` the same way. Orasmyn should show as **matched**, not new. After the commit, Orasmyn should have two source documents and no duplicate entry.
  3. Try a URL import with a Google Doc shared as "Anyone with the link can view".
  4. In the Console, check what the test imports cost.

## Decisions to make

### Cost vs. quality
Each import makes one request to `claude-opus-5-5`, the most capable and most expensive model. If imports cost more than you'd like, switch to a cheaper model by changing `MODEL` in `service/src/ai/extractEntities.ts` (line 6). Check current prices on the Console's pricing page and compare them with what the test imports actually cost.

### The beta refusal fallback
The call enables a beta feature, which retries refusals on the server:
- `betas: ["server-side-fallback-2026-07-01"]`
- `fallbacks: "default"`

It works fine. If you'd rather not depend on a beta, delete those two lines from `extractEntities.ts`. The code already turns a refusal into a readable error.

### Personal or work account
If the usage should be billed to a Hive account rather than a personal one, that's an organisation set-up question. Ask through the Slack `/assist` command instead of creating the account yourself.

## Security notes

- Keep the key only in `service/.env`, never in frontend code or any `VITE_*` variable. Vite builds `VITE_*` variables into the browser bundle.
- If a key leaks, revoke it in the Console and create a new one.
- Use the Console's spend limit as the safety net. The app has no rate limiting of its own.
