# Agent.Recruit Relayer

> The automation layer that keeps Agent.Recruit warm. It turns new or stale onchain state into reviewed profiles, refreshed match records, and current team drafts.

## What it is responsible for

The relayer never owns the user-created data model. Wallets still sign profiles and opportunities themselves.

What the relayer does own is the follow-through:

- profile review when a profile is new or updated
- focused pair matching when a profile-opportunity record is missing or stale
- team draft generation when an opportunity needs a fresher assignment set

In practice, that means the relayer is the bridge between "someone wrote to the registries" and "the network has now caught up around that write."

The relayer does not pre-render or summarize proof URLs for AI review. It only triggers the automation call. The GenLayer contracts read the stored public proof URLs and render them with `gl.nondet.web.render(...)` during nondeterministic execution before the prompt reasons about the evidence.

## Automation order

Every cycle runs the same three-stage loop:

1. Review profiles that have not been reviewed since their latest update.
2. Refresh match records for active opportunities against candidate profiles.
3. Rebuild team drafts when accepted match data changed or a draft is missing.

This ordering matters. Match refresh depends on fresh profile state. Team drafting depends on fresh match state.

## Run it

From the repo root:

```bash
npm install
npm run sync-env
npm run dev:relayer
```

From inside this workspace:

```bash
npm install
npm run dev
```

If `RELAYER_PRIVATE_KEY` is missing, the relayer will stay in read-only standby and log why instead of attempting writes.

## Environment

The relayer loads, in order:

- `.env.generated`
- `.env`
- `.env.local`

Important values:

- `GENLAYER_RPC_URL`
- `GENLAYER_NETWORK`
- `RELAYER_ACCOUNT_ADDRESS`
- `RELAYER_PRIVATE_KEY`
- `RELAYER_LOOP_MS`
- `TALENT_REGISTRY_ADDRESS`
- `OPPORTUNITY_REGISTRY_ADDRESS`
- `MATCHING_ENGINE_ADDRESS`
- `TEAM_FORMATION_ADDRESS`

[`../scripts/sync-env.ts`](../scripts/sync-env.ts) generates [`./.env.generated`](./.env.generated) from the live deployment file.

## Important files

- [`src/index.ts`](./src/index.ts) - the background loop and scheduling logic
- [`src/genlayer.ts`](./src/genlayer.ts) - GenLayer read/write helpers
- [`src/config.ts`](./src/config.ts) - env loading and validation
- [`src/state-store.ts`](./src/state-store.ts) - in-memory status tracking
- [`src/status.ts`](./src/status.ts) - failure summaries

## Commands

- `npm run dev` - watch mode
- `npm run build` - compile TypeScript
- `npm run lint` - typecheck without emitting
- `npm run test` - run Vitest

## Design note

The relayer is intentionally narrow. It does not invent product state. It observes what already exists, decides what is stale, and submits the smallest next automation write needed to bring the network back into sync.
