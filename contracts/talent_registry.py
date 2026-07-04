# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import typing


class TalentRegistry(gl.Contract):
    relayer: Address
    next_profile_id: u256
    next_event_id: u256
    profile_ids: DynArray[u256]
    owner_to_profiles: TreeMap[str, str]
    profiles: TreeMap[u256, str]

    def __init__(self, relayer_address):
        self.relayer = Address(str(relayer_address))
        self.next_profile_id = u256(1)
        self.next_event_id = u256(1)

    def _tick(self) -> int:
        event_id = int(self.next_event_id)
        self.next_event_id = self.next_event_id + u256(1)
        return event_id

    def _require_owner(self, owner: str) -> None:
        if str(gl.message.sender_address) != owner:
            raise gl.vm.UserError("[EXPECTED] Only the profile owner can update this record")

    def _require_relayer(self) -> None:
        if gl.message.sender_address != self.relayer:
            raise gl.vm.UserError("[EXPECTED] Only the relayer can trigger automated review")

    def _load(self, profile_id: int) -> typing.Dict[str, typing.Any]:
        key = u256(profile_id)
        if key not in self.profiles:
            raise gl.vm.UserError("[EXPECTED] Profile not found")
        return json.loads(self.profiles[key])

    def _save(self, profile_id: int, data: typing.Dict[str, typing.Any]) -> None:
        self.profiles[u256(profile_id)] = json.dumps(data)

    def _append_owner_profile(self, owner: str, profile_id: int) -> None:
        ids = json.loads(self.owner_to_profiles[owner]) if owner in self.owner_to_profiles else []
        ids.append(profile_id)
        self.owner_to_profiles[owner] = json.dumps(ids)

    @gl.public.write
    def create_profile(
        self,
        handle: str,
        headline: str,
        summary: str,
        skills_json: str,
        role_preferences_json: str,
        availability: str,
        location: str,
        github_url: str,
        resume_url: str,
        portfolio_url: str,
        linkedin_url: str,
        socials_json: str,
        evidence_json: str
    ) -> int:
        profile_id = int(self.next_profile_id)
        event_id = self._tick()
        owner = str(gl.message.sender_address)
        profile = {
            "profileId": profile_id,
            "owner": owner,
            "handle": handle,
            "headline": headline,
            "summary": summary,
            "skills": json.loads(skills_json),
            "rolePreferences": json.loads(role_preferences_json),
            "availability": availability,
            "location": location,
            "githubUrl": github_url,
            "resumeUrl": resume_url,
            "portfolioUrl": portfolio_url,
            "linkedinUrl": linkedin_url,
            "socials": json.loads(socials_json),
            "evidence": json.loads(evidence_json),
            "tier": "Basic",
            "reviewStatus": "Submitted",
            "version": 1,
            "createdAt": event_id,
            "updatedAt": event_id,
            "reviewedAt": 0
        }
        self._save(profile_id, profile)
        self.profile_ids.append(u256(profile_id))
        self._append_owner_profile(owner, profile_id)
        self.next_profile_id = self.next_profile_id + u256(1)
        return profile_id

    @gl.public.write
    def update_profile(
        self,
        profile_id: int,
        handle: str,
        headline: str,
        summary: str,
        skills_json: str,
        role_preferences_json: str,
        availability: str,
        location: str,
        github_url: str,
        resume_url: str,
        portfolio_url: str,
        linkedin_url: str,
        socials_json: str,
        evidence_json: str
    ) -> None:
        profile = self._load(profile_id)
        self._require_owner(profile["owner"])
        profile["handle"] = handle
        profile["headline"] = headline
        profile["summary"] = summary
        profile["skills"] = json.loads(skills_json)
        profile["rolePreferences"] = json.loads(role_preferences_json)
        profile["availability"] = availability
        profile["location"] = location
        profile["githubUrl"] = github_url
        profile["resumeUrl"] = resume_url
        profile["portfolioUrl"] = portfolio_url
        profile["linkedinUrl"] = linkedin_url
        profile["socials"] = json.loads(socials_json)
        profile["evidence"] = json.loads(evidence_json)
        profile["reviewStatus"] = "Submitted"
        profile["version"] = int(profile["version"]) + 1
        profile["updatedAt"] = self._tick()
        self._save(profile_id, profile)

    @gl.public.write
    def request_profile_review(
        self,
        profile_id: int,
        evidence_summary: str,
        validator_notes: str
    ) -> str:
        self._require_relayer()
        profile = self._load(profile_id)
        version = int(profile["version"])

        def leader_fn() -> str:
            prompt = (
                "You are evaluating a talent profile for a decentralized accelerator. "
                "Return ONLY one word: Basic, Verified, or EliteBuilder.\n"
                "Profile summary:\n" + profile["summary"] + "\n"
                "Evidence summary:\n" + evidence_summary + "\n"
                "Validator notes:\n" + validator_notes
            )
            raw = gl.nondet.exec_prompt(prompt)
            text = str(raw).strip()
            if "EliteBuilder" in text:
                return "EliteBuilder"
            if "Verified" in text:
                return "Verified"
            return "Basic"

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            mine = leader_fn()
            theirs = str(leaders_res.calldata)
            return mine == theirs

        tier = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        profile["tier"] = tier
        profile["reviewStatus"] = "Matches Ready"
        profile["reviewedAt"] = self._tick()
        profile["lastReviewVersion"] = version
        self._save(profile_id, profile)
        return tier

    @gl.public.view
    def get_profile(self, profile_id: int) -> str:
        return json.dumps(self._load(profile_id))

    @gl.public.view
    def get_profiles_by_owner(self, owner: str) -> str:
        result = []
        target_owner = str(owner).lower()
        i = 0
        while i < len(self.profile_ids):
            profile = self._load(int(self.profile_ids[i]))
            if str(profile["owner"]).lower() == target_owner:
                result.append(profile)
            i += 1
        return json.dumps(result)

    @gl.public.view
    def list_profiles(self) -> str:
        result = []
        i = 0
        while i < len(self.profile_ids):
            result.append(self._load(int(self.profile_ids[i])))
            i += 1
        return json.dumps(result)
