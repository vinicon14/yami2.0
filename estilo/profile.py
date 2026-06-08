"""Writing style profile data model and persistence."""

import json
import os
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional


PROFILE_PATH = os.path.join(
    os.environ.get("YAMI_HOME", os.path.expanduser("~/.yami")),
    "pendrive",
    "estilo-escrita.json",
)


@dataclass
class StyleProfile:
    vocabulary: dict = field(default_factory=lambda: {
        "formal": 0.0,
        "technical": 0.0,
        "casual": 0.0,
    })
    formality: str = "noticia"
    slangUsage: str = "noticia"
    sentenceStructure: str = "noticia"
    averageMessageLength: int = 0
    emojiFrequency: str = "noticia"
    commonExpressions: list = field(default_factory=list)
    greeting: str = ""
    closing: str = ""
    primaryTone: str = ""
    secondaryTone: str = ""
    styleTags: list = field(default_factory=list)
    description: str = ""


@dataclass
class WritingProfile:
    version: int = 1
    enabled: bool = True
    lastUpdated: str = ""
    totalMessagesAnalyzed: int = 0
    profile: StyleProfile = field(default_factory=StyleProfile)
    rawSamples: list = field(default_factory=list)


def load_profile(path: Optional[str] = None) -> WritingProfile:
    path = path or PROFILE_PATH
    if not os.path.exists(path):
        return WritingProfile(
            lastUpdated=datetime.now(timezone.utc).isoformat()
        )
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return _dict_to_profile(data)
    except (json.JSONDecodeError, KeyError, TypeError):
        return WritingProfile(
            lastUpdated=datetime.now(timezone.utc).isoformat()
        )


def save_profile(profile: WritingProfile, path: Optional[str] = None) -> str:
    path = path or PROFILE_PATH
    profile.lastUpdated = datetime.now(timezone.utc).isoformat()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_profile_to_dict(profile), f, ensure_ascii=False, indent=2)
    return path


def reset_profile(path: Optional[str] = None) -> WritingProfile:
    profile = WritingProfile(
        lastUpdated=datetime.now(timezone.utc).isoformat()
    )
    save_profile(profile, path)
    return profile


def _dict_to_profile(data: dict) -> WritingProfile:
    profile_data = data.get("profile", {})
    return WritingProfile(
        version=data.get("version", 1),
        enabled=data.get("enabled", True),
        lastUpdated=data.get("lastUpdated", ""),
        totalMessagesAnalyzed=data.get("totalMessagesAnalyzed", 0),
        profile=StyleProfile(
            vocabulary=profile_data.get("vocabulary", {
                "formal": 0.0, "technical": 0.0, "casual": 0.0,
            }),
            formality=profile_data.get("formality", ""),
            slangUsage=profile_data.get("slangUsage", ""),
            sentenceStructure=profile_data.get("sentenceStructure", ""),
            averageMessageLength=profile_data.get("averageMessageLength", 0),
            emojiFrequency=profile_data.get("emojiFrequency", ""),
            commonExpressions=profile_data.get("commonExpressions", []),
            greeting=profile_data.get("greeting", ""),
            closing=profile_data.get("closing", ""),
            primaryTone=profile_data.get("primaryTone", ""),
            secondaryTone=profile_data.get("secondaryTone", ""),
            styleTags=profile_data.get("styleTags", []),
            description=profile_data.get("description", ""),
        ),
        rawSamples=data.get("rawSamples", []),
    )


def _profile_to_dict(profile: WritingProfile) -> dict:
    return {
        "version": profile.version,
        "enabled": profile.enabled,
        "lastUpdated": profile.lastUpdated,
        "totalMessagesAnalyzed": profile.totalMessagesAnalyzed,
        "profile": {
            "vocabulary": profile.profile.vocabulary,
            "formality": profile.profile.formality,
            "slangUsage": profile.profile.slangUsage,
            "sentenceStructure": profile.profile.sentenceStructure,
            "averageMessageLength": profile.profile.averageMessageLength,
            "emojiFrequency": profile.profile.emojiFrequency,
            "commonExpressions": profile.profile.commonExpressions,
            "greeting": profile.profile.greeting,
            "closing": profile.profile.closing,
            "primaryTone": profile.profile.primaryTone,
            "secondaryTone": profile.profile.secondaryTone,
            "styleTags": profile.profile.styleTags,
            "description": profile.profile.description,
        },
        "rawSamples": profile.rawSamples,
    }
