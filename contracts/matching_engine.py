# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import typing


class MatchingEngine(gl.Contract):
    relayer: Address
    next_event_id: u256
    match_keys: DynArray[str]
    matches: TreeMap[str, str]
    profile_to_keys: TreeMap[str, str]
    opportunity_to_keys: TreeMap[str, str]
    recent_activity: DynArray[str]

    def __init__(self, relayer_address):
        self.relayer = Address(str(relayer_address))
        self.next_event_id = u256(1)

    def _tick(self) -> int:
        event_id = int(self.next_event_id)
        self.next_event_id = self.next_event_id + u256(1)
        return event_id

    def _require_relayer(self) -> None:
        if gl.message.sender_address != self.relayer:
            raise gl.vm.UserError("[EXPECTED] Only the relayer can submit a match request")

    def _match_key(self, profile_id: int, opportunity_id: int) -> str:
        return str(profile_id) + ":" + str(opportunity_id)

    def _safe_json(self, raw: str) -> typing.Any:
        return json.loads(raw)

    def _ensure_index(self, table: TreeMap[str, str], key: str, value: str) -> None:
        items = json.loads(table[key]) if key in table else []
        i = 0
        while i < len(items):
            if items[i] == value:
                return
            i += 1
        items.append(value)
        table[key] = json.dumps(items)

    def _append_recent(self, payload: typing.Dict[str, typing.Any]) -> None:
        self.recent_activity.append(json.dumps(payload))

    @gl.public.write
    def request_match(
        self,
        profile_id: int,
        opportunity_id: int,
        profile_version: int,
        opportunity_version: int,
        profile_json: str,
        opportunity_json: str
    ) -> str:
        self._require_relayer()
        key = self._match_key(profile_id, opportunity_id)
        profile = self._safe_json(profile_json)
        opportunity = self._safe_json(opportunity_json)

        def leader_fn() -> str:
            prompt = (
                "You are scoring a talent profile against an opportunity for a decentralized accelerator. "
                "Use the candidate's skills, role preferences, work evidence, GitHub, resume, portfolio, LinkedIn, and socials when present. "
                "Thin or missing evidence should reduce confidence. Return ONLY JSON with key score. score must be an integer from 0 to 100.\n"
                "Profile:\n" + profile_json + "\nOpportunity:\n" + opportunity_json
            )
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            data = raw if isinstance(raw, dict) else json.loads(str(raw))
            score = 50
            try:
                score = int(data.get("score", 50))
            except (TypeError, ValueError):
                score = 50
            if score < 0:
                score = 0
            if score > 100:
                score = 100
            band = "Weak"
            if score >= 90:
                band = "Excellent"
            elif score >= 75:
                band = "Strong"
            elif score >= 55:
                band = "Emerging"
            summary = "Consensus fit generated"
            if band == "Excellent":
                summary = "High-confidence fit for this role"
            elif band == "Strong":
                summary = "Strong fit aligned to the role scope"
            elif band == "Emerging":
                summary = "Promising fit with room to validate"
            else:
                summary = "Weak fit against current requirements"
            return json.dumps({"score": score, "band": band, "summary": summary})

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            theirs = json.loads(str(leaders_res.calldata))
            mine = json.loads(leader_fn())
            return mine["band"] == theirs["band"]

        result = json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))
        event_id = self._tick()
        record = {
            "matchKey": key,
            "profileId": profile_id,
            "opportunityId": opportunity_id,
            "profileHandle": profile["handle"],
            "opportunityTitle": opportunity["title"],
            "score": int(result["score"]),
            "band": result["band"],
            "summary": result["summary"],
            "profileVersion": profile_version,
            "opportunityVersion": opportunity_version,
            "status": "Matches Ready",
            "createdAt": event_id,
            "updatedAt": event_id,
            "syncedAt": event_id
        }
        if key not in self.matches:
            self.match_keys.append(key)
        self.matches[key] = json.dumps(record)
        self._ensure_index(self.profile_to_keys, str(profile_id), key)
        self._ensure_index(self.opportunity_to_keys, str(opportunity_id), key)
        self._append_recent(
            {
                "timestamp": event_id,
                "label": "New match",
                "opportunityTitle": opportunity["title"],
                "profileHandle": profile["handle"],
                "score": int(result["score"]),
                "band": result["band"]
            }
        )
        return json.dumps(record)

    @gl.public.view
    def get_match(self, profile_id: int, opportunity_id: int) -> str:
        key = self._match_key(profile_id, opportunity_id)
        if key not in self.matches:
            return ""
        return self.matches[key]

    @gl.public.view
    def list_matches_for_profile(self, profile_id: int) -> str:
        result = []
        key = str(profile_id)
        if key not in self.profile_to_keys:
            return json.dumps(result)
        items = json.loads(self.profile_to_keys[key])
        i = 0
        while i < len(items):
            result.append(json.loads(self.matches[items[i]]))
            i += 1
        return json.dumps(result)

    @gl.public.view
    def list_matches_for_opportunity(self, opportunity_id: int) -> str:
        result = []
        key = str(opportunity_id)
        if key not in self.opportunity_to_keys:
            return json.dumps(result)
        items = json.loads(self.opportunity_to_keys[key])
        i = 0
        while i < len(items):
            result.append(json.loads(self.matches[items[i]]))
            i += 1
        return json.dumps(result)

    @gl.public.view
    def list_recent_match_activity(self) -> str:
        result = []
        i = len(self.recent_activity)
        while i > 0:
            i -= 1
            result.append(json.loads(self.recent_activity[i]))
        return json.dumps(result)
