import json


def test_create_and_get_profile(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/talent_registry.py", args=[str(direct_alice)])
    direct_vm.sender = direct_alice

    profile_id = contract.create_profile(
        "nkechi.build",
        "Consensus-native frontend engineer",
        "Builds trusted interfaces",
        json.dumps(["React", "TypeScript"]),
        json.dumps(["Frontend Lead"]),
        "Full time",
        "Remote",
        "https://github.com/example",
        "https://resume.example/nkechi.pdf",
        "https://portfolio.example",
        "https://linkedin.com/in/example",
        json.dumps(["https://x.com/nkechi"]),
        json.dumps([{"label": "GitHub", "value": "https://github.com/example"}]),
    )

    profile = json.loads(contract.get_profile(profile_id))
    assert profile["handle"] == "nkechi.build"
    assert profile["version"] == 1
    assert profile["resumeUrl"] == "https://resume.example/nkechi.pdf"


def test_update_profile_increments_version(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/talent_registry.py", args=[str(direct_alice)])
    direct_vm.sender = direct_alice

    profile_id = contract.create_profile(
        "nkechi.build",
        "Consensus-native frontend engineer",
        "Builds trusted interfaces",
        json.dumps(["React", "TypeScript"]),
        json.dumps(["Frontend Lead"]),
        "Full time",
        "Remote",
        "https://github.com/example",
        "https://resume.example/nkechi.pdf",
        "https://portfolio.example",
        "https://linkedin.com/in/example",
        json.dumps(["https://x.com/nkechi"]),
        json.dumps([{"label": "GitHub", "value": "https://github.com/example"}]),
    )

    contract.update_profile(
        profile_id,
        "nkechi.build",
        "Consensus-native frontend engineer",
        "Builds trusted interfaces and relayer surfaces",
        json.dumps(["React", "TypeScript", "GenLayer"]),
        json.dumps(["Frontend Lead"]),
        "Full time",
        "Remote",
        "https://github.com/example",
        "https://resume.example/nkechi-v2.pdf",
        "https://portfolio.example",
        "https://linkedin.com/in/example",
        json.dumps(["https://x.com/nkechi", "https://farcaster.xyz/nkechi"]),
        json.dumps([{"label": "Portfolio", "value": "https://portfolio.example"}]),
    )

    profile = json.loads(contract.get_profile(profile_id))
    assert profile["version"] == 2
    assert "GenLayer" in profile["skills"]
    assert profile["socials"][1] == "https://farcaster.xyz/nkechi"


def test_profile_review_accepts_public_proof_urls(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/talent_registry.py", args=[str(direct_alice)])
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(r".*", "Verified")

    profile_id = contract.create_profile(
        "nkechi.build",
        "Consensus-native frontend engineer",
        "Builds trusted interfaces and relayer surfaces",
        json.dumps(["React", "TypeScript", "GenLayer"]),
        json.dumps(["Frontend Lead"]),
        "Full time",
        "Remote",
        "https://github.com/example",
        "https://resume.example/nkechi.pdf",
        "https://portfolio.example",
        "https://linkedin.com/in/example",
        json.dumps(["https://x.com/nkechi"]),
        json.dumps([{"label": "Hackathon", "value": "https://portfolio.example/hackathon"}]),
    )

    tier = contract.request_profile_review(
        profile_id,
        "Public proof URLs are rendered in-contract.",
        "Handle: nkechi.build | Headline: Consensus-native frontend engineer",
    )
    profile = json.loads(contract.get_profile(profile_id))

    assert tier == "Verified"
    assert profile["tier"] == "Verified"
    assert profile["reviewStatus"] == "Matches Ready"
