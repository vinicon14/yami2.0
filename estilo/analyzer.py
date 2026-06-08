"""Analyzes user messages to extract writing style patterns.

Performs statistical and heuristic analysis of text samples to build
a writing style profile covering vocabulary, formality, sentence structure,
emoji usage, tone, and common expressions.
"""

import re
import math
from collections import Counter
from typing import List, Optional

from .profile import WritingProfile, StyleProfile


# ── helpers ──────────────────────────────────────────────────────────────────

_EMOJI_PATTERN = re.compile(
    "[\U0001F600-\U0001F64F"  
    "\U0001F300-\U0001F5FF"  
    "\U0001F680-\U0001F6FF"  
    "\U0001F1E0-\U0001F1FF"  
    "\U00002702-\U000027B0"  
    "\U000024C2-\U0001F251"  
    "\U0001F926-\U0001FA9F"  
    "\u2600-\u26FF"          
    "\u2700-\u27BF"          
    "]+",
    flags=re.UNICODE,
)

_URL_PATTERN = re.compile(r"https?://\S+", re.IGNORECASE)
_MENTION_PATTERN = re.compile(r"@\w+")

# Portuguese slang markers
_SLANG_MARKERS = [
    "tipo", "tlgd", "tlg", "blz", "beleza", "tranquilo", "mano", "cara",
    "parça", "véi", "vei", "mó", "dahora", "da hora", "fala sério",
    "qualé", "qual é", "valeu", "brigado", "brigada", "obg", "obgd",
    "pq", "porque", "q", "vc", "vcs", "tá", "ta", "né", "nao", "não",
    "sim", "s", "mt", "mto", "muito", "bem", "dms", "demais", "puts",
    "aff", "nossa", "caramba", "poxa", "véi", "man", "brother", "cara",
    "fala", "diz", "então", "entao", "ent", "ata", "aham", "hum",
    "hm", "ok", "okay", "dboa", "de boa", "suave", "firmeza", "tbm",
    "também", "tb", "tmb", "sla", "sei lá", "seila", "rlx", "relaxa",
    "vdd", "verdade", "fds", "final de semana", "kd", "cadê", "cade",
]

# Formal markers (Portuguese)
_FORMAL_MARKERS = [
    "portanto", "entretanto", "contudo", "todavia", "outrossim",
    "ademais", "destarte", "conquanto", "mormente", "sobretudo",
    "prezado", "atenciosamente", "cordiais", "cumprimentos",
    "solicito", "requer", "encaminho", "segue em anexo",
    "conforme solicitado", "conforme acordo", "conforme combinado",
    "vimos por meio deste", "vimos através deste",
    "aguardo retorno", "coloco-me à disposição",
]

# Technical markers (Portuguese)
_TECHNICAL_MARKERS = [
    "implementar", "deploy", "commit", "merge", "branch", "código",
    "função", "classe", "método", "api", "endpoint", "rest", "http",
    "json", "xml", "banco de dados", "servidor", "cliente",
    "frontend", "backend", "fullstack", "devops", "docker",
    "container", "teste", "debug", "log", "erro", "exceção",
    "algorítmo", "algoritmo", "performance", "otimizar",
    "refatorar", "código-fonte", "repositório", "pr", "pull request",
    "issue", "pipeline", "ci/cd", "build", "compilar",
]

# Vocabulary-like words for frequency analysis
_FORMAL_VOCAB = set(_FORMAL_MARKERS)
_TECHNICAL_VOCAB = set(_TECHNICAL_MARKERS)
_SLANG_VOCAB = set(_SLANG_MARKERS)


# ── public API ───────────────────────────────────────────────────────────────

class WritingAnalyzer:
    """Analyzes text samples to extract and update writing style profiles."""

    def __init__(self, profile: Optional[WritingProfile] = None):
        self.profile = profile or WritingProfile()

    def analyze(self, text: str) -> dict:
        """Analyze a single text and return extracted features."""
        if not text or not text.strip():
            return {}

        cleaned = _clean_text(text)
        words = cleaned.split()
        sentences = _split_sentences(cleaned)
        emojis = _EMOJI_PATTERN.findall(text)

        word_count = len(words)
        char_count = len(text)
        sentence_count = max(len(sentences), 1)

        return {
            "wordCount": word_count,
            "charCount": char_count,
            "sentenceCount": sentence_count,
            "avgSentenceLength": round(word_count / sentence_count, 1),
            "avgMessageLength": char_count,
            "hasEmoji": len(emojis) > 0,
            "emojiCount": len(emojis),
            "emojiList": emojis,
            "formalityScore": _calculate_formality(text, words),
            "technicalScore": _calculate_technical(text, words),
            "slangScore": _calculate_slang(text, words),
            "hasGreeting": _is_greeting(text),
            "hasClosing": _is_closing(text),
            "isQuestion": text.strip().endswith("?"),
            "isExclamation": text.strip().endswith("!"),
            "allCapsRatio": _all_caps_ratio(words),
        }

    def update_profile(self, text: str) -> WritingProfile:
        """Analyze text and update the writing profile incrementally."""
        features = self.analyze(text)
        if not features:
            return self.profile

        profile = self.profile
        total = profile.totalMessagesAnalyzed
        p = profile.profile

        weight = 1.0 / (total + 1) if total > 0 else 1.0
        prev_weight = 1.0 - weight

        p.vocabulary["formal"] = round(
            p.vocabulary["formal"] * prev_weight + features["formalityScore"] * weight, 3
        )
        p.vocabulary["technical"] = round(
            p.vocabulary["technical"] * prev_weight + features["technicalScore"] * weight, 3
        )
        p.vocabulary["casual"] = round(
            p.vocabulary["casual"] * prev_weight + features["slangScore"] * weight, 3
        )

        if features.get("avgMessageLength", 0) > 0:
            old_len = p.averageMessageLength
            p.averageMessageLength = round(
                old_len * prev_weight + features["avgMessageLength"] * weight
            ) if total > 0 else features["avgMessageLength"]

        if features["hasEmoji"]:
            _update_categorical(p, "emojiFrequency", "frequente")
        else:
            _update_categorical(p, "emojiFrequency", "raro")

        words = _clean_text(text).split()
        expressions = _extract_common_expressions(text)
        if expressions:
            p.commonExpressions = list(set(p.commonExpressions + expressions))[:10]

        formality = features["formalityScore"]
        technical = features["technicalScore"]
        slang = features["slangScore"]

        dominant = max(formality, technical, slang)
        if dominant == formality:
            _update_categorical(p, "formality", "formal")
        elif dominant == technical:
            _update_categorical(p, "formality", "técnico")
        else:
            _update_categorical(p, "formality", "casual")

        tone = _detect_tone(text, features)
        if tone:
            if not p.primaryTone or total < 3:
                p.primaryTone = tone
            elif total < 8:
                p.secondaryTone = tone
            else:
                if total % 5 == 0:
                    p.secondaryTone = p.primaryTone
                    p.primaryTone = tone

        if features.get("hasGreeting"):
            greeting = _extract_greeting(text)
            if greeting:
                _update_categorical(p, "greeting", greeting)

        if features.get("hasClosing"):
            closing = _extract_closing(text)
            if closing:
                _update_categorical(p, "closing", closing)

        if words:
            avg_len = sum(len(w) for w in words) / len(words)
            if avg_len < 4:
                _update_categorical(p, "sentenceStructure", "curto-direto")
            elif avg_len > 7:
                _update_categorical(p, "sentenceStructure", "elaborado")
            else:
                _update_categorical(p, "sentenceStructure", "equilibrado")

        profile.totalMessagesAnalyzed = total + 1

        p.styleTags = _generate_style_tags(p)

        profile.rawSamples.append({
            "text": text[:500],
            "features": features,
            "analyzedAt": __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ).isoformat(),
        })
        if len(profile.rawSamples) > 50:
            profile.rawSamples = profile.rawSamples[-50:]

        p.description = _generate_description(p)

        return profile


# ── internal analysis helpers ────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    text = _URL_PATTERN.sub("", text)
    text = _MENTION_PATTERN.sub("", text)
    text = _EMOJI_PATTERN.sub("", text)
    text = re.sub(r"[^\w\sÀ-ÿ]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip().lower()


def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]


def _calculate_formality(text: str, words: List[str]) -> float:
    text_lower = text.lower()
    if not words:
        return 0.0
    matches = sum(1 for m in _FORMAL_MARKERS if m in text_lower)
    return min(1.0, matches * 2.0 / len(words))


def _calculate_technical(text: str, words: List[str]) -> float:
    text_lower = text.lower()
    if not words:
        return 0.0
    matches = sum(1 for m in _TECHNICAL_MARKERS if m in text_lower)
    return min(1.0, matches * 1.5 / len(words))


def _calculate_slang(text: str, words: List[str]) -> float:
    text_lower = text.lower()
    if not words:
        return 0.0
    matches = sum(1 for m in _SLANG_MARKERS if m in text_lower)
    return min(1.0, matches * 2.0 / len(words))


def _all_caps_ratio(words: List[str]) -> float:
    if not words:
        return 0.0
    upper = sum(1 for w in words if w.isupper() and len(w) > 1)
    return upper / len(words)


def _is_greeting(text: str) -> bool:
    greetings = [
        "oi", "ola", "olá", "hey", "hei", "e aí", "eai", "fala",
        "oie", "oii", "opa", "bom dia", "boa tarde", "boa noite",
        "salve", "yo", "bem vindo", "bem-vindo",
    ]
    text_lower = text.lower().strip()
    for g in greetings:
        if text_lower.startswith(g) or text_lower.startswith(g + ",") or text_lower.startswith(g + " "):
            return True
    return False


def _extract_greeting(text: str) -> str:
    first_word = text.lower().strip().split()[0] if text.strip().split() else ""
    first_word = first_word.strip(",!?.:;")
    return first_word


def _is_closing(text: str) -> bool:
    closings = [
        "tchau", "até", "ate", "falou", "flw", "vlw", "valeu",
        "brigado", "obrigado", "obrigada", "abraço", "abraco",
        "beijo", "fui", "tmj", "tamo junto", "inté", "até mais",
        "ate mais", "nos vemos", "falows", "flws", "thanks",
        "bye", "bjs", "abs",
    ]
    text_lower = text.lower().strip()
    last_word = text_lower.split()[-1] if text_lower.split() else ""
    for c in closings:
        if text_lower.endswith(c) or last_word == c:
            return True
    return False


def _extract_closing(text: str) -> str:
    words = text.lower().strip().split()
    if not words:
        return ""
    return words[-1].strip(",!?.:;")


def _detect_tone(text: str, features: dict) -> str:
    text_lower = text.lower()
    if features.get("isExclamation"):
        if any(w in text_lower for w in ["caramba", "nossa", "puts", "aff", "que"]):
            return "surpreso"
        return "entusiasmado"
    if features.get("isQuestion"):
        if any(w in text_lower for w in ["por que", "como", "quando", "onde"]):
            return "curioso"
        return "inquisitivo"
    if any(w in text_lower for w in ["kkk", "haha", "lol", "rs", "hehe"]):
        return "humorístico"
    if any(w in text_lower for w in ["triste", "que pena", "poxa", "aff"]):
        return "preocupado"
    if features.get("technicalScore", 0) > 0.3:
        return "técnico"
    if features.get("slangScore", 0) > 0.3:
        return "descontraído"
    if features.get("formalityScore", 0) > 0.3:
        return "formal"
    return "neutro"


def _extract_common_expressions(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    bigrams = re.findall(r"\b(\w+)\s+(\w+)\b", text_lower)
    for w1, w2 in bigrams:
        phrase = f"{w1} {w2}"
        if phrase in ["é isso", "vamos ver", "tipo assim", "pois é",
                       "pois não", "é verdade", "ah sim", "então tá",
                       "tá bom", "ta bom", "boa ideia", "faz sentido",
                       "vou ver", "pode ser", "é que", "da uma",
                       "vou fazer", "ja vi"]:
            found.append(phrase)
    for word in text_lower.split():
        if word in ["então", "entao", "tipo", "assim", "puts", "nossa",
                     "cara", "mano", "véi", "vei", "pois", "vamos"]:
            if word not in found:
                found.append(word)
    return found[:5]


def _generate_style_tags(p: StyleProfile) -> List[str]:
    tags = []
    if p.formality:
        tags.append(p.formality)
    if p.primaryTone:
        tags.append(p.primaryTone)
    if p.secondaryTone and p.secondaryTone != p.primaryTone:
        tags.append(p.secondaryTone)
    if p.emojiFrequency == "frequente":
        tags.append("usa emojis")
    vm = max(p.vocabulary.values()) if p.vocabulary else 0
    if vm > 0:
        dominant = max(p.vocabulary, key=p.vocabulary.get)
        if dominant == "formal" and p.vocabulary["formal"] > 0.3:
            tags.append("vocabulário formal")
        elif dominant == "technical" and p.vocabulary["technical"] > 0.3:
            tags.append("vocabulário técnico")
        else:
            tags.append("vocabulário casual")
    if p.sentenceStructure:
        if "curto" in p.sentenceStructure:
            tags.append("frases curtas")
        elif "elaborado" in p.sentenceStructure:
            tags.append("frases elaboradas")
        else:
            tags.append("frases equilibradas")
    return tags[:6]


def _generate_description(p: StyleProfile) -> str:
    parts = []
    if p.formality:
        parts.append(f"estilo {p.formality}")
    if p.primaryTone:
        parts.append(f"tom {p.primaryTone}")
    if p.averageMessageLength > 0:
        if p.averageMessageLength < 50:
            parts.append("mensagens curtas")
        elif p.averageMessageLength < 150:
            parts.append("mensagens médias")
        else:
            parts.append("mensagens longas")
    if p.emojiFrequency == "frequente":
        parts.append("usa emojis com frequência")
    elif p.emojiFrequency == "raro":
        parts.append("raramente usa emojis")
    return ", ".join(parts) if parts else "perfil em construção"


def _update_categorical(obj, attr: str, value: str):
    """Update a categorical attribute with recency bias."""
    current = getattr(obj, attr, "")
    if current == "noticia" or not current:
        setattr(obj, attr, value)
    elif current != value:
        setattr(obj, attr, value)
