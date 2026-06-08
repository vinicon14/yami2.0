"""Command-line interface for writing style profile management.

Provides user-facing commands to view, edit, reset, disable, and analyze
the writing style profile.
"""

import sys
import json
from typing import Optional

# Fix encoding for Windows console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from .profile import load_profile, save_profile, reset_profile
from .analyzer import WritingAnalyzer
from .prompt import build_style_section, build_compact_style_section


def cmd_status():
    """Display current writing style profile status."""
    profile = load_profile()
    p = profile.profile

    print("\n" + "=" * 70)
    print("YAMI - Estilo de Escrita do Usuário - STATUS")
    print("=" * 70 + "\n")

    print(f"Status: {'ATIVADO' if profile.enabled else 'DESATIVADO'}")
    print(f"Mensagens analisadas: {profile.totalMessagesAnalyzed}")
    print(f"Última atualização: {profile.lastUpdated}\n")

    print("PERFIL DETECTADO:")
    print("-" * 70)

    if profile.totalMessagesAnalyzed == 0:
        print("(Nenhuma mensagem analisada ainda. Envie mensagens para construir o perfil.)\n")
    else:
        print(f"Descrição: {p.description}")
        print(f"Formalidade: {p.formality or '(não detectada)'}")
        print(f"Tom principal: {p.primaryTone or '(não detectado)'}")
        if p.secondaryTone and p.secondaryTone != p.primaryTone:
            print(f"Tom secundário: {p.secondaryTone}")
        print(f"Estrutura das frases: {p.sentenceStructure or '(não detectada)'}")
        print(f"Tamanho médio de mensagem: {p.averageMessageLength} caracteres")
        print(f"Frequência de emojis: {p.emojiFrequency or '(não detectada)'}")
        if p.commonExpressions:
            print(f"Expressões recorrentes: {', '.join(p.commonExpressions)}")
        if p.greeting:
            print(f"Cumprimento típico: \"{p.greeting}\"")
        if p.closing:
            print(f"Encerramento típico: \"{p.closing}\"")
        if p.styleTags:
            print(f"Rótulos de estilo: {', '.join(p.styleTags)}\n")


def cmd_view_section():
    """Display the full writing style section for the AI prompt."""
    section = build_style_section()
    if not section:
        print("Perfil de estilo desativado ou vazio.")
        return
    print("\n" + "=" * 70)
    print("Seção de Estilo para Prompt do AI")
    print("=" * 70 + "\n")
    print(section)
    print("\n")


def cmd_analyze(text: str):
    """Analyze a text sample and show features extracted."""
    analyzer = WritingAnalyzer()
    features = analyzer.analyze(text)

    print("\n" + "=" * 70)
    print("Análise de Texto")
    print("=" * 70 + "\n")

    print(f"Texto: {text[:80]}{'...' if len(text) > 80 else ''}\n")

    if not features:
        print("(Texto vazio ou inválido)\n")
        return

    print("Características detectadas:")
    print(f"  Contagem de palavras: {features.get('wordCount', 0)}")
    print(f"  Contagem de caracteres: {features.get('charCount', 0)}")
    print(f"  Contagem de sentenças: {features.get('sentenceCount', 0)}")
    print(f"  Comprimento médio de sentença: {features.get('avgSentenceLength', 0):.1f} palavras")
    print(f"  Contém emoji: {features.get('hasEmoji', False)}")
    if features.get('emojiList'):
        print(f"  Emojis encontrados: {', '.join(features['emojiList'])}")
    print(f"  Pontuação de formalidade: {features.get('formalityScore', 0):.2f}")
    print(f"  Pontuação técnica: {features.get('technicalScore', 0):.2f}")
    print(f"  Pontuação de gíria: {features.get('slangScore', 0):.2f}")
    print(f"  Tem cumprimento: {features.get('hasGreeting', False)}")
    print(f"  Tem encerramento: {features.get('hasClosing', False)}")
    print(f"  É pergunta: {features.get('isQuestion', False)}")
    print(f"  É exclamação: {features.get('isExclamation', False)}")
    print()


def cmd_update(text: str):
    """Analyze text and update the writing style profile."""
    profile = load_profile()
    analyzer = WritingAnalyzer(profile)
    updated_profile = analyzer.update_profile(text)
    save_profile(updated_profile)

    print("\n" + "=" * 70)
    print("Perfil Atualizado")
    print("=" * 70 + "\n")

    print(f"✓ Análise concluída")
    print(f"  Total de mensagens analisadas: {updated_profile.totalMessagesAnalyzed}")
    print(f"  Descrição atualizada: {updated_profile.profile.description}\n")


def cmd_reset():
    """Reset the writing style profile to default."""
    profile = reset_profile()
    print("\n" + "=" * 70)
    print("Perfil Redefinido")
    print("=" * 70 + "\n")

    print("✓ Perfil de estilo foi redefinido")
    print("  O sistema começará a analisar novamente suas mensagens.\n")


def cmd_disable():
    """Disable the writing style system."""
    profile = load_profile()
    profile.enabled = False
    save_profile(profile)
    print("\n" + "=" * 70)
    print("Sistema Desativado")
    print("=" * 70 + "\n")

    print("✓ Sistema de análise de estilo foi desativado")
    print("  Para reativar, use 'estilo enable'.\n")


def cmd_enable():
    """Enable the writing style system."""
    profile = load_profile()
    profile.enabled = True
    save_profile(profile)
    print("\n" + "=" * 70)
    print("Sistema Ativado")
    print("=" * 70 + "\n")

    print("✓ Sistema de análise de estilo foi ativado")
    print("  O YAMI começará a analisar suas mensagens.\n")


def cmd_edit(updates_json: str):
    """Manually edit the writing style profile.

    Expects a JSON string with fields to update, e.g.:
    '{"formality": "casual", "primaryTone": "descontraído"}'
    """
    profile = load_profile()
    try:
        updates = json.loads(updates_json)
    except json.JSONDecodeError:
        print("Erro: JSON inválido")
        return

    p = profile.profile
    for key, value in updates.items():
        if hasattr(p, key):
            setattr(p, key, value)

    save_profile(profile)
    print("\n" + "=" * 70)
    print("Perfil Atualizado Manualmente")
    print("=" * 70 + "\n")

    print(f"✓ Campos atualizados: {', '.join(updates.keys())}")
    print(f"  Descrição: {p.description}\n")


def cmd_help():
    """Display help information."""
    print("\n" + "=" * 70)
    print("YAMI - Estilo de Escrita - Ajuda")
    print("=" * 70 + "\n")

    print("Comandos disponíveis:\n")

    print("  status              Mostrar status do perfil de escrita")
    print("  view-section        Ver a seção completa para o prompt do AI")
    print("  analyze <TEXT>      Analisar um texto e mostrar características")
    print("  update <TEXT>       Analisar e atualizar o perfil com um texto")
    print("  reset               Redefinir o perfil para o padrão")
    print("  enable              Ativar o sistema de análise")
    print("  disable             Desativar o sistema de análise")
    print("  edit <JSON>         Editar manualmente o perfil com JSON")
    print("  help                Mostrar esta ajuda")
    print()


def main(args: Optional[list] = None):
    """Main CLI entry point."""
    if args is None:
        args = sys.argv[1:]

    if not args or args[0] == "help":
        cmd_help()
        return

    cmd = args[0]
    rest = args[1:] if len(args) > 1 else []

    if cmd == "status":
        cmd_status()
    elif cmd == "view-section":
        cmd_view_section()
    elif cmd == "analyze":
        text = " ".join(rest) if rest else ""
        if text:
            cmd_analyze(text)
        else:
            print("Uso: estilo analyze <texto>")
    elif cmd == "update":
        text = " ".join(rest) if rest else ""
        if text:
            cmd_update(text)
        else:
            print("Uso: estilo update <texto>")
    elif cmd == "reset":
        cmd_reset()
    elif cmd == "enable":
        cmd_enable()
    elif cmd == "disable":
        cmd_disable()
    elif cmd == "edit":
        json_str = " ".join(rest) if rest else ""
        if json_str:
            cmd_edit(json_str)
        else:
            print("Uso: estilo edit '<JSON>'")
    else:
        print(f"Comando desconhecido: {cmd}")
        print("Use 'estilo help' para ajuda")


if __name__ == "__main__":
    main()
