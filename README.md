# Agent.Recruit

> A consensus-native hiring network on GenLayer. Talent profiles, founder opportunities, fit scores, and draft teams all become shared onchain state.

`GenLayer` `Studionet` `Next.js 16` `React 19` `TypeScript` `Python intelligent contracts`

## Contents

- The idea, in plain English
- What it does
- Why it feels different
- Architecture
- The workflow
- Runs on Studionet
- Product surface
- Run it yourself
- Commands
- Configuration
- Repository layout

## The idea, in plain English

Most recruiting products are really search boxes with nice branding. They reward polished wording, keyword stuffing, and whoever knows how to game the filter.

Agent.Recruit takes a different path.

A builder signs an onchain talent profile with real proof: skills, role preferences, GitHub, resume, portfolio, socials, and extra evidence. A founder signs an onchain opportunity with an actual role structure: mission, skills, commitment, and the exact slots to fill.

Then the network does the judgment work.

A relayer asks GenLayer-backed contracts to review the profile, score profile-opportunity pairs, and assemble a draft team from the strongest accepted fits. What comes back is not "trust our AI." What comes back is a shared result the product can point to: this profile was reviewed, this opportunity matched at 91, this slot was filled by the best currently accepted candidate.

The public network view stays live. The private wallet view stays personal. The state itself lives onchain.

## What it does

Agent.Recruit currently ships four core capabilities:

- Talent profiles: wallet-owned profiles with structured evidence and versioned updates.
- Founder opportunities: wallet-owned opportunity postings with explicit slot definitions.
- Consensus matching: focused profile-opportunity pair scoring with `Weak`, `Emerging`, `Strong`, and `Excellent` fit bands.
- Team formation: automated draft teams generated from the freshest accepted match records.

The latest product layer adds two wallet-scoped views on top of the public network feed:

- Personal dashboard: shows every profile owned by the connected wallet, its review status, and every accepted match tied to it.
- Founder dashboard: shows every opportunity owned by the connected wallet, its incoming match records, and its current draft-team state.

## Why it feels different

Three product decisions define the project:

1. Signed writes and automated writes are visibly different.
   Humans sign profile and opportunity changes. Review, matching, and team formation are relayer-driven.

2. The UI only shows outcomes, not hidden model reasoning.
   The product exposes tiers, scores, statuses, and synced timestamps. It does not pretend opaque AI text is the product.

3. Public network state and private wallet context can coexist.
   The landing page tells the shared story. The personal and founder dashboards tell the "what belongs to me?" story without leaving the chain.

## Architecture

The repo is split into six working parts:

1. `contracts/talent_registry.py`
   Stores talent profiles, ownership, versioning, and review status.

2. `contracts/opportunity_registry.py`
   Stores founder opportunities, required skills, slot definitions, and archive state.

3. `contracts/matching_engine.py`
   Persists match records, fit bands, summaries, and recent network activity.

4. `contracts/team_formation.py`
   Generates draft-team assignments from the best currently accepted candidates per slot.

5. `relayer/`
   Watches for stale or missing automation work and schedules review, match refresh, and team-draft writes.

6. `web/`
   Presents the public network view, the signed write flows, and the wallet-scoped dashboards. It also exposes a server route that can trigger prioritized automation refreshes for the active user journey.

In one line:

```text
Signed profile/opportunity writes -> onchain registries -> relayer automation -> match records + team drafts -> live web dashboards
```

## The workflow

### 1. Talent creates a profile

The builder signs a profile write with handle, headline, summary, skills, role preferences, availability, location, and supporting proof links.

### 2. Founder posts an opportunity

The founder signs an opportunity with mission, summary, required skills, compensation notes, and slot structure.

### 3. The relayer reviews the profile

If a profile is new or updated, the relayer submits `request_profile_review`, which promotes the profile into a consensus-reviewed tier such as `Basic`, `Verified`, or `EliteBuilder`.

### 4. The relayer refreshes focused pairs

The relayer compares active opportunities against candidate profiles. If a pair is missing or stale, it submits `request_match` and persists a fresh `MatchRecord`.

### 5. The relayer drafts a team

Once enough match data exists, the relayer submits `generate_team_draft` so each opportunity can surface a best-current assignment per slot.

### 6. The web app presents both lenses

The public landing page shows the shared network pulse. The personal and founder dashboards show exactly what the connected wallet owns and what automation has already done around it.

## Runs on Studionet

The current deployment file is [`deployments/studionet.json`](./deployments/studionet.json).

| Surface | Value |
| --- | --- |
| Network | `studionet` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://genlayer-explorer.vercel.app` |
| Relayer address | `0xD0b8aEEdf195499773415323cae517e5b8369F94` |
| Talent Registry | `0x907FD3204316EB328353e6CAeB9BaBC1CfFAb6cD` |
| Opportunity Registry | `0x80888e1CaC0A45ca3022422B14895f4FD0039425` |
| Matching Engine | `0x384E7Fa970616CeBDA0f60d0045D073c2396F0d5` |
| Team Formation | `0x1844A82aCB45ee854027eD1261eC4D2d1927Ed17` |

## Product surface

The main app experience currently includes:

- `/` - premium landing page, network snapshot, recent activity, and live deployment context.
- `/app/talent` - signed profile creation flow.
- `/app/opportunities` - signed opportunity creation flow.
- `/app/personal` - wallet-owned profile dashboard with matches.
- `/app/founder` - wallet-owned opportunity dashboard with matches and team drafts.
- `/api/automation/run` - server-side automation endpoint for prioritized refreshes.

## Run it yourself

### Prerequisites

- Node.js 20+
- `npm`
- A browser wallet such as Nightly or MetaMask for signed writes
- A funded Studionet relayer account if you want automated writes enabled
- GenLayer CLI on your `PATH` if you want to redeploy contracts

### Local app loop

```bash
npm install
npm run sync-env
npm run dev
```

What that does:

- `npm run sync-env` copies the deployed addresses from [`deployments/studionet.json`](./deployments/studionet.json) into [`web/.env.local`](./web/.env.local) and [`relayer/.env.generated`](./relayer/.env.generated).
- `npm run dev` starts both workspaces: the Next.js app and the background relayer loop.
- The web app is served at `http://localhost:3000`.

To actually let automation write onchain, fill in `RELAYER_PRIVATE_KEY` in [`relayer/.env.generated`](./relayer/.env.generated) or provide it through your environment.

### Redeploy to Studionet

```bash
# PowerShell example
$env:RELAYER_ACCOUNT_ADDRESS="0xYourRelayerAddress"
npm run deploy:studionet
npm run sync-env
```

The deploy script updates [`deployments/studionet.json`](./deployments/studionet.json) with the new contract addresses.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the web app and relayer together |
| `npm run dev:web` | Starts only the Next.js frontend |
| `npm run dev:relayer` | Starts only the automation relayer |
| `npm run build` | Builds both workspaces |
| `npm run lint` | Runs TypeScript and frontend lint checks |
| `npm run test` | Runs the web and relayer test suites |
| `npm run sync-env` | Rebuilds workspace env files from the deployment file |
| `npm run deploy:studionet` | Deploys the four contracts to Studionet |

## Configuration

Most address wiring is generated for you by `npm run sync-env`.

### Public web env

- `NEXT_PUBLIC_GENLAYER_NETWORK`
- `NEXT_PUBLIC_GENLAYER_RPC_URL`
- `NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS`
- `NEXT_PUBLIC_TEAM_FORMATION_ADDRESS`

### Automation env

- `GENLAYER_NETWORK`
- `GENLAYER_RPC_URL`
- `RELAYER_ACCOUNT_ADDRESS`
- `RELAYER_PRIVATE_KEY`
- `RELAYER_LOOP_MS`
- `TALENT_REGISTRY_ADDRESS`
- `OPPORTUNITY_REGISTRY_ADDRESS`
- `MATCHING_ENGINE_ADDRESS`
- `TEAM_FORMATION_ADDRESS`

## Repository layout

```text
contracts/      GenLayer intelligent contracts for profiles, opportunities, matches, and draft teams
deployments/    Current Studionet deployment metadata
relayer/        Background automation loop and config
scripts/        Deployment and env sync scripts
tests/direct/   Direct contract-level smoke tests
web/            Next.js frontend, live readers, dashboards, and automation API route
```

## Final note

The point of Agent.Recruit is not to make hiring look futuristic. The point is to make subjective hiring signals legible, shared, and automatable without hiding where the important writes came from.

The wallet signs what should be owned.
The relayer automates what should be refreshed.
The network state stays visible.
