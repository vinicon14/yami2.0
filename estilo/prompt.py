"""Generates AI prompt sections from the writing style profile.

Transforms the structured writing profile into natural language
instructions that can be injected into the YAMI system prompt,
enabling the AI to reproduce the user's writing style.
"""

from typing import Optional

from .profile import WritingProfile, load_profile


def build_style_section(profile: Optional[WritingProfile] = None) -> str:
    """Build the writing style section for the AI system prompt.

    Returns a markdown section describing the user's writing style
    that the AI should follow when composing messages on behalf of
    the user.
    """
    if profile is None:
        profile = load_profile()

    if not profile.enabled:
        return ""

    p = profile.profile

    lines = []
    lines.append("## Estilo de Escrita do Usuário")
    lines.append("")
    lines.append(
        "O YAMI mantém um perfil de escrita do usuário para reproduzir "
        "seu estilo natural ao redigir mensagens, e-mails, respostas "
        "automáticas ou qualquer conteúdo em nome dele."
    )
    lines.append("")

    if p.description:
        lines.append(f"**Resumo:** {p.description}")
        lines.append("")

    if p.formality:
        lines.append(f"- **Grau de formalidade:** {p.formality}")

    if p.primaryTone:
        secondary = f", {p.secondaryTone}" if p.secondaryTone and p.secondaryTone != p.primaryTone else ""
        lines.append(f"- **Tom emocional:** {p.primaryTone}{secondary}")

    if p.sentenceStructure:
        lines.append(f"- **Estrutura das frases:** {p.sentenceStructure}")

    if p.averageMessageLength > 0:
        lines.append(f"- **Tamanho médio das mensagens:** ~{p.averageMessageLength} caracteres")

    if p.emojiFrequency:
        freq_map = {
            "frequente": "usa emojis com frequência natural",
            "raro": "raramente usa emojis",
        }
        label = freq_map.get(p.emojiFrequency, p.emojiFrequency)
        lines.append(f"- **Uso de emojis:** {label}")

    if p.greeting:
        lines.append(f"- **Forma de cumprimento:** \"{p.greeting}\"")

    if p.closing:
        lines.append(f"- **Forma de encerramento:** \"{p.closing}\"")

    if p.commonExpressions:
        exp_str = ", ".join(f"\"{e}\"" for e in p.commonExpressions[:6])
        lines.append(f"- **Expressões recorrentes:** {exp_str}")

    if p.vocabulary and any(v > 0.15 for v in p.vocabulary.values()):
        vocab_desc = _vocabulary_description(p)
        lines.append(f"- **Vocabulário:** {vocab_desc}")

    if p.styleTags:
        tags_str = ", ".join(p.styleTags)
        lines.append(f"- **Estilo geral:** {tags_str}")

    lines.append("")
    lines.append("### Instruções de Reprodução de Estilo")
    lines.append("")
    lines.append(
        "Quando solicitado a escrever em nome do usuário (responder "
        "mensagens, redigir e-mails, criar textos, produzir respostas "
        "automáticas ou elaborar comunicados), o YAMI DEVE:"
    )
    lines.append("")
    lines.append("1. Seguir o perfil de estilo acima como referência principal")
    lines.append("2. Adaptar o tom ao contexto específico da comunicação")
    lines.append("3. Usar as mesmas expressões e padrões do usuário")
    lines.append("4. Manter o mesmo nível de formalidade observado")
    lines.append("5. Respeitar a frequência de emojis do usuário")
    lines.append("6. Priorizar autenticidade sobre perfeição gramatical")
    lines.append("7. Nunca imitar de forma caricata ou exagerada")
    lines.append("8. Ao reproduzir em nome do usuário ao vivo, indicar brevemente que está no estilo dele")

    lines.append("")
    lines.append(
        "Este perfil é continuamente atualizado com base nas interações "
        "do usuário. Para desativar, redefinir ou editar manualmente, "
        "basta pedir."
    )

    return "\n".join(lines)


def build_compact_style_section(profile: Optional[WritingProfile] = None) -> str:
    """Build a compact one-line style summary for space-constrained contexts."""
    if profile is None:
        profile = load_profile()
    if not profile.enabled:
        return ""
    p = profile.profile
    if not p.description:
        return ""
    return f"[Estilo do usuário: {p.description}]"


def build_style_instruction_line(profile: Optional[WritingProfile] = None) -> str:
    """Build a single-line instruction for the AI about style reproduction."""
    if profile is None:
        profile = load_profile()
    if not profile.enabled:
        return ""
    p = profile.profile
    tags = ", ".join(p.styleTags) if p.styleTags else "estilo natural do usuário"
    return (
        f"Quando escrever em nome do usuário, reproduza seu estilo natural "
        f"({tags}). Mantenha autenticidade e consistência."
    )


def _vocabulary_description(p) -> str:
    parts = []
    if p.vocabulary.get("formal", 0) > 0.3:
        parts.append("formal")
    if p.vocabulary.get("technical", 0) > 0.3:
        parts.append("técnico")
    if p.vocabulary.get("casual", 0) > 0.3:
        parts.append("casual")
    if not parts:
        dominant = max(p.vocabulary, key=p.vocabulary.get)
        parts.append(dominant)
    return ", ".join(parts)
