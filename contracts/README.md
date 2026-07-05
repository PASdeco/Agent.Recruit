# Agent.Recruit Contracts

> Four GenLayer intelligent contracts form the onchain backbone of Agent.Recruit: profiles, opportunities, matches, and team drafts.

## Contract set

| Contract | Responsibility |
| --- | --- |
| `talent_registry.py` | Wallet-owned talent profiles, evidence payloads, versioning, and review status |
| `opportunity_registry.py` | Wallet-owned founder opportunities, slot structure, and archive state |
| `matching_engine.py` | Consensus fit scoring, persistent match records, and recent activity feed |
| `team_formation.py` | Best-current slot assignment and draft team generation |

## Design split

The contracts intentionally separate human authorship from network automation.

- Builders and founders sign the records that should belong to them.
- The relayer triggers the automated writes that should be operational, not authored.

That is why owner checks protect profile and opportunity updates, while relayer checks protect review, matching, and team generation flows.

## Core behaviors

### Talent Registry

- Creates a profile with structured evidence and metadata.
- Tracks `version`, `createdAt`, `updatedAt`, and `reviewedAt`.
- Lets the relayer call `request_profile_review` to move a profile into a reviewed tier.

### Opportunity Registry

- Creates a structured opportunity with required skills and slots.
- Tracks ownership and version changes.
- Supports archiving without destroying the historical record.

### Matching Engine

- Accepts focused pair requests from the relayer.
- Stores persistent `MatchRecord` objects keyed by `profileId:opportunityId`.
- Maintains profile and opportunity indexes plus a recent public activity feed.

### Team Formation

- Builds a best-current assignment list per slot.
- Prevents the same profile from filling multiple slots in the same draft.
- Returns `Ready` or `InsufficientCandidates` depending on accepted input quality.

## Testing surface

Direct contract smoke tests currently live in [`../tests/direct`](../tests/direct).

- [`test_talent_registry.py`](../tests/direct/test_talent_registry.py)
- [`test_matching_and_team.py`](../tests/direct/test_matching_and_team.py)

Those tests cover the profile lifecycle plus the essential match and draft behavior.

## Deployment note

The repo deploys these contracts in Studionet order through [`../scripts/deploy-studionet.ts`](../scripts/deploy-studionet.ts):

1. `talent_registry.py`
2. `opportunity_registry.py`
3. `matching_engine.py`
4. `team_formation.py`

The resulting addresses are written back into [`../deployments/studionet.json`](../deployments/studionet.json).

## Important idea

These contracts are not trying to be a full recruiting company onchain. They are doing something cleaner:

they store ownership,
they store state transitions,
they store consensus outcomes,
and they leave presentation to the app layer.
