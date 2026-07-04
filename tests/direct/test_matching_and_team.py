import json


def test_match_record_persists(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/matching_engine.py", args=[str(direct_alice)])
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(r".*", json.dumps({"score": 91, "band": "Excellent", "summary": "High confidence fit"}))

    record = json.loads(
        contract.request_match(
            1,
            11,
            2,
            3,
            json.dumps({"handle": "nkechi.build"}),
            json.dumps({"title": "Frontend Lead"}),
        )
    )

    assert record["score"] == 91
    assert record["opportunityTitle"] == "Frontend Lead"


def test_team_generation_assigns_best_candidate(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/team_formation.py", args=[str(direct_alice)])
    direct_vm.sender = direct_alice

    draft = json.loads(
        contract.generate_team_draft(
            11,
            3,
            json.dumps(
                [
                    {"slotKey": "frontend-lead", "role": "Frontend Lead"},
                    {"slotKey": "contract-dev", "role": "Smart Contract Dev"},
                ]
            ),
            json.dumps(
                [
                    {
                        "slotKey": "frontend-lead",
                        "profileId": 1,
                        "profileHandle": "nkechi.build",
                        "score": 94,
                        "band": "Excellent",
                    },
                    {
                        "slotKey": "contract-dev",
                        "profileId": 2,
                        "profileHandle": "tobi.relayer",
                        "score": 89,
                        "band": "Strong",
                    },
                ]
            ),
        )
    )

    assert draft["filledSlots"] == 2
    assert draft["assignments"][0]["profileHandle"] == "nkechi.build"
