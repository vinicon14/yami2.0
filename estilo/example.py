"""Example usage of the writing style analysis system.

This script demonstrates how to use the writing style module
programmatically for analysis, profile management, and prompt generation.
"""

from profile import load_profile, save_profile
from analyzer import WritingAnalyzer
from prompt import build_style_section, build_compact_style_section


def example_basic_usage():
    """Basic example: Load profile and view it."""
    print("=" * 70)
    print("Example 1: Load and View Profile")
    print("=" * 70)
    
    profile = load_profile()
    p = profile.profile
    
    print(f"Profile Status:")
    print(f"  Enabled: {profile.enabled}")
    print(f"  Messages analyzed: {profile.totalMessagesAnalyzed}")
    print(f"  Formality: {p.formality}")
    print(f"  Primary tone: {p.primaryTone}")
    print(f"  Description: {p.description}")
    print()


def example_analyze_text():
    """Example: Analyze a single text."""
    print("=" * 70)
    print("Example 2: Analyze a Text")
    print("=" * 70)
    
    sample_text = "Opa, tudo bem? Achei o projeto bem interessante, tipo, vamos explorar mais as ideias."
    
    analyzer = WritingAnalyzer()
    features = analyzer.analyze(sample_text)
    
    print(f"Text: {sample_text}")
    print(f"\nExtracted features:")
    for key, value in features.items():
        print(f"  {key}: {value}")
    print()


def example_update_profile():
    """Example: Analyze text and update profile."""
    print("=" * 70)
    print("Example 3: Update Profile with Sample Texts")
    print("=" * 70)
    
    profile = load_profile()
    analyzer = WritingAnalyzer(profile)
    
    samples = [
        "Oi, tudo bem? Como vai você?",
        "Valeu pela ajuda, tipo, fez toda diferença mesmo!",
        "Então, a gente combinou de ir amanhã né. Tá tranquilo?",
        "Haha, que massa! Vamos sim, com certeza.",
        "Opa, vi sua mensagem. Tá bom, já vou respondendo lá.",
    ]
    
    print(f"Initial state: {profile.totalMessagesAnalyzed} messages analyzed")
    
    for text in samples:
        profile = analyzer.update_profile(text)
        print(f"Analyzed: \"{text[:50]}...\"")
        print(f"  Total analyzed: {profile.totalMessagesAnalyzed}")
        print(f"  Description: {profile.profile.description}")
    
    save_profile(profile)
    print(f"\nProfile saved with {profile.totalMessagesAnalyzed} messages analyzed")
    print()


def example_generate_prompt():
    """Example: Generate prompt section for AI."""
    print("=" * 70)
    print("Example 4: Generate Prompt Section for AI")
    print("=" * 70)
    
    profile = load_profile()
    
    # Full section
    print("Full style section:\n")
    full_section = build_style_section(profile)
    print(full_section)
    
    print("\n" + "-" * 70 + "\n")
    
    # Compact version
    print("Compact version:\n")
    compact = build_compact_style_section(profile)
    print(compact if compact else "(Profile empty - no compact section)")
    print()


def example_manual_edit():
    """Example: Manually edit the profile."""
    print("=" * 70)
    print("Example 5: Manual Profile Edit")
    print("=" * 70)
    
    profile = load_profile()
    
    print(f"Before: {profile.profile.primaryTone}")
    
    # Manual edit
    profile.profile.primaryTone = "descontraído"
    profile.profile.formality = "casual"
    profile.profile.commonExpressions = ["então", "tipo", "vamos lá"]
    
    # Regenerate description
    from analyzer import _generate_description
    profile.profile.description = _generate_description(profile.profile)
    
    save_profile(profile)
    
    print(f"After: {profile.profile.primaryTone}")
    print(f"Updated description: {profile.profile.description}")
    print()


def example_reset():
    """Example: Reset profile."""
    print("=" * 70)
    print("Example 6: Reset Profile")
    print("=" * 70)
    
    from profile import reset_profile
    
    profile = reset_profile()
    
    print(f"Profile reset!")
    print(f"Messages analyzed: {profile.totalMessagesAnalyzed}")
    print(f"Description: {profile.profile.description}")
    print()


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("YAMI Writing Style System - Example Usage")
    print("=" * 70 + "\n")
    
    try:
        example_basic_usage()
        example_analyze_text()
        example_update_profile()
        example_generate_prompt()
        example_manual_edit()
        example_reset()
        
        print("=" * 70)
        print("All examples completed successfully!")
        print("=" * 70)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
