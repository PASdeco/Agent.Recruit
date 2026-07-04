# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import typing


class OpportunityRegistry(gl.Contract):
    next_opportunity_id: u256
    next_event_id: u256
    opportunity_ids: DynArray[u256]
    owner_to_opportunities: TreeMap[str, str]
    opportunities: TreeMap[u256, str]

    def __init__(self):
        self.next_opportunity_id = u256(1)
        self.next_event_id = u256(1)

    def _tick(self) -> int:
        event_id = int(self.next_event_id)
        self.next_event_id = self.next_event_id + u256(1)
        return event_id

    def _require_owner(self, owner: str) -> None:
        if str(gl.message.sender_address) != owner:
            raise gl.vm.UserError("[EXPECTED] Only the opportunity owner can update this record")

    def _load(self, opportunity_id: int) -> typing.Dict[str, typing.Any]:
        key = u256(opportunity_id)
        if key not in self.opportunities:
            raise gl.vm.UserError("[EXPECTED] Opportunity not found")
        return json.loads(self.opportunities[key])

    def _save(self, opportunity_id: int, data: typing.Dict[str, typing.Any]) -> None:
        self.opportunities[u256(opportunity_id)] = json.dumps(data)

    def _append_owner_opportunity(self, owner: str, opportunity_id: int) -> None:
        ids = json.loads(self.owner_to_opportunities[owner]) if owner in self.owner_to_opportunities else []
        ids.append(opportunity_id)
        self.owner_to_opportunities[owner] = json.dumps(ids)

    @gl.public.write
    def create_opportunity(
        self,
        title: str,
        mission: str,
        summary: str,
        required_skills_json: str,
        seniority: str,
        commitment: str,
        location_mode: str,
        compensation_text: str,
        slots_json: str
    ) -> int:
        opportunity_id = int(self.next_opportunity_id)
        event_id = self._tick()
        owner = str(gl.message.sender_address)
        opportunity = {
            "opportunityId": opportunity_id,
            "owner": owner,
            "title": title,
            "mission": mission,
            "summary": summary,
            "requiredSkills": json.loads(required_skills_json),
            "seniority": seniority,
            "commitment": commitment,
            "locationMode": location_mode,
            "compensationText": compensation_text,
            "slots": json.loads(slots_json),
            "status": "Active",
            "version": 1,
            "createdAt": event_id,
            "updatedAt": event_id
        }
        self._save(opportunity_id, opportunity)
        self.opportunity_ids.append(u256(opportunity_id))
        self._append_owner_opportunity(owner, opportunity_id)
        self.next_opportunity_id = self.next_opportunity_id + u256(1)
        return opportunity_id

    @gl.public.write
    def update_opportunity(
        self,
        opportunity_id: int,
        title: str,
        mission: str,
        summary: str,
        required_skills_json: str,
        seniority: str,
        commitment: str,
        location_mode: str,
        compensation_text: str,
        slots_json: str
    ) -> None:
        opportunity = self._load(opportunity_id)
        self._require_owner(opportunity["owner"])
        opportunity["title"] = title
        opportunity["mission"] = mission
        opportunity["summary"] = summary
        opportunity["requiredSkills"] = json.loads(required_skills_json)
        opportunity["seniority"] = seniority
        opportunity["commitment"] = commitment
        opportunity["locationMode"] = location_mode
        opportunity["compensationText"] = compensation_text
        opportunity["slots"] = json.loads(slots_json)
        opportunity["version"] = int(opportunity["version"]) + 1
        opportunity["updatedAt"] = self._tick()
        self._save(opportunity_id, opportunity)

    @gl.public.write
    def archive_opportunity(self, opportunity_id: int) -> None:
        opportunity = self._load(opportunity_id)
        self._require_owner(opportunity["owner"])
        opportunity["status"] = "Archived"
        opportunity["updatedAt"] = self._tick()
        self._save(opportunity_id, opportunity)

    @gl.public.view
    def get_opportunity(self, opportunity_id: int) -> str:
        return json.dumps(self._load(opportunity_id))

    @gl.public.view
    def get_opportunities_by_owner(self, owner: str) -> str:
        result = []
        target_owner = str(owner).lower()
        i = 0
        while i < len(self.opportunity_ids):
            opportunity = self._load(int(self.opportunity_ids[i]))
            if str(opportunity["owner"]).lower() == target_owner:
                result.append(opportunity)
            i += 1
        return json.dumps(result)

    @gl.public.view
    def list_opportunities(self) -> str:
        result = []
        i = 0
        while i < len(self.opportunity_ids):
            result.append(self._load(int(self.opportunity_ids[i])))
            i += 1
        return json.dumps(result)
