# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import typing


class TeamFormation(gl.Contract):
    relayer: Address
    next_event_id: u256
    team_drafts: TreeMap[str, str]

    def __init__(self, relayer_address):
        self.relayer = Address(str(relayer_address))
        self.next_event_id = u256(1)

    def _tick(self) -> int:
        event_id = int(self.next_event_id)
        self.next_event_id = self.next_event_id + u256(1)
        return event_id

    def _require_relayer(self) -> None:
        if gl.message.sender_address != self.relayer:
            raise gl.vm.UserError("[EXPECTED] Only the relayer can generate a team draft")

    def _best_matches(
        self,
        slots: typing.List[typing.Any],
        candidates: typing.List[typing.Any]
    ) -> typing.List[typing.Any]:
        chosen = []
        used = {}
        slot_index = 0
        while slot_index < len(slots):
            slot = slots[slot_index]
            best = None
            best_score = -1
            candidate_index = 0
            while candidate_index < len(candidates):
                candidate = candidates[candidate_index]
                profile_key = str(candidate["profileId"])
                if profile_key not in used and slot["slotKey"] == candidate["slotKey"]:
                    score = int(candidate["score"])
                    if score > best_score:
                        best = candidate
                        best_score = score
                candidate_index += 1
            if best is not None:
                used[str(best["profileId"])] = True
                chosen.append(
                    {
                        "slotKey": slot["slotKey"],
                        "role": slot["role"],
                        "profileId": best["profileId"],
                        "profileHandle": best["profileHandle"],
                        "score": best["score"],
                        "band": best["band"],
                        "status": "Matched"
                    }
                )
            else:
                chosen.append(
                    {
                        "slotKey": slot["slotKey"],
                        "role": slot["role"],
                        "profileId": 0,
                        "profileHandle": "",
                        "score": 0,
                        "band": "Weak",
                        "status": "Open"
                    }
                )
            slot_index += 1
        return chosen

    @gl.public.write
    def generate_team_draft(
        self,
        opportunity_id: int,
        opportunity_version: int,
        slots_json: str,
        candidate_matches_json: str
    ) -> str:
        self._require_relayer()
        slots = json.loads(slots_json)
        candidates = json.loads(candidate_matches_json)
        assignments = self._best_matches(slots, candidates)
        event_id = self._tick()
        filled = 0
        i = 0
        while i < len(assignments):
            if assignments[i]["status"] == "Matched":
                filled += 1
            i += 1
        draft = {
            "opportunityId": opportunity_id,
            "opportunityVersion": opportunity_version,
            "status": "Ready" if filled > 0 else "InsufficientCandidates",
            "filledSlots": filled,
            "totalSlots": len(assignments),
            "assignments": assignments,
            "updatedAt": event_id,
            "syncedAt": event_id
        }
        self.team_drafts[str(opportunity_id)] = json.dumps(draft)
        return json.dumps(draft)

    @gl.public.write
    def refresh_team_draft(
        self,
        opportunity_id: int,
        opportunity_version: int,
        slots_json: str,
        candidate_matches_json: str
    ) -> str:
        return self.generate_team_draft(
            opportunity_id,
            opportunity_version,
            slots_json,
            candidate_matches_json
        )

    @gl.public.view
    def get_team_draft_by_opportunity(self, opportunity_id: int) -> str:
        key = str(opportunity_id)
        if key not in self.team_drafts:
            return ""
        return self.team_drafts[key]
