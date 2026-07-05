# Agent.Recruit Web

> The premium frontend for Agent.Recruit. It turns live GenLayer state into a public network story, signed creation flows, and wallet-scoped private dashboards.

## What lives here

This workspace does three jobs at once:

1. It sells the product properly.
   The landing page frames Agent.Recruit as a consensus-native talent network instead of a generic recruitment tool.

2. It handles the signed user actions.
   Talent can create profiles. Founders can post opportunities. Those writes go onchain through an injected wallet.

3. It makes automation visible.
   The app reads live contract state, shows recent match activity, and exposes wallet-owned dashboard views for both builders and founders.

## Main surfaces

- `/` - landing page, network snapshot, live deployment context, and recent activity.
- `/app/talent` - create a structured onchain talent profile.
- `/app/opportunities` - post a structured founder opportunity.
- `/app/personal` - wallet-owned profile dashboard and accepted matches.
- `/app/founder` - wallet-owned opportunity dashboard, incoming matches, and draft teams.
- `/api/automation/run` - server route that triggers a prioritized automation step for the active user flow.

## Product rules the UI makes explicit

- Profile and opportunity writes are signed.
- Profile review, match refresh, and team generation are automated.
- The product shows outcomes such as tiers, fit bands, and synced timestamps.
- The product does not expose hidden validator reasoning as if it were the product itself.

## Local development

From the repo root:

```bash
npm install
npm run sync-env
npm run dev:web
```

Or from inside this workspace:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment

The frontend expects these values:

- `NEXT_PUBLIC_GENLAYER_NETWORK`
- `NEXT_PUBLIC_GENLAYER_RPC_URL`
- `NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS`
- `NEXT_PUBLIC_TEAM_FORMATION_ADDRESS`

Most of the time you should not hand-edit them. Run `npm run sync-env` at the repo root and let the repo rebuild [`web/.env.local`](./.env.local) from the deployment file.

If you want the in-app automation endpoint to submit writes as well, the web server also needs:

- `RELAYER_ACCOUNT_ADDRESS`
- `RELAYER_PRIVATE_KEY`
- `TALENT_REGISTRY_ADDRESS`, `OPPORTUNITY_REGISTRY_ADDRESS`, `MATCHING_ENGINE_ADDRESS`, and `TEAM_FORMATION_ADDRESS`

## Commands

- `npm run dev` - start the Next.js app
- `npm run build` - production build
- `npm run start` - serve the production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `genlayer-js` for chain reads and writes
- Vitest + Testing Library for frontend tests

## Notes

Wallet connection logic prefers a usable injected provider, attempts to switch the wallet onto Studionet, and stores the active address locally so the personal and founder dashboards can reopen with context.

This workspace is not a static marketing shell. It is the live lens over the network.
