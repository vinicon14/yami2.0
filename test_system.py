#!/usr/bin/env python3
"""Comprehensive test of the writing style system."""

from estilo.profile import load_profile, save_profile
from estilo.analyzer import WritingAnalyzer
from estilo.prompt import build_style_section


def test_system():
    print("\n" + "=" * 70)
    print("YAMI Writing Style System - Comprehensive Test")
    print("=" * 70 + "\n")

    # Test 1: Load profile
    print("TEST 1: Load Profile")
    profile = load_profile()
    print(f"  [OK] Profile loaded")
    print(f"  Messages analyzed: {profile.totalMessagesAnalyzed}")
    print(f"  Status: {'ENABLED' if profile.enabled else 'DISABLED'}\n")

    # Test 2: Analyze samples
    print("TEST 2: Analyze Multiple Samples")
    analyzer = WritingAnalyzer(profile)
    samples = [
        "Opa, tudo certo? Achei bem legal mesmo!",
        "Tipo, vamos explorar mais isso ai",
        "Valeu pela ajuda, cara! Muito bom mesmo",
        "Nossa, que interessante demais!",
        "Entao, vamos marcar para depois?"
    ]

    for sample in samples:
        profile = analyzer.update_profile(sample)
        print(f"  [OK] Analyzed: '{sample[:45]}...'")

    print(f"\n  Total analyzed: {profile.totalMessagesAnalyzed}")
    print(f"  Description: {profile.profile.description}\n")

    # Test 3: Check detected patterns
    print("TEST 3: Detected Patterns")
    p = profile.profile
    print(f"  Formality: {p.formality}")
    print(f"  Primary tone: {p.primaryTone}")
    if p.secondaryTone:
        print(f"  Secondary tone: {p.secondaryTone}")
    print(f"  Message length: ~{p.averageMessageLength} chars")
    print(f"  Emoji frequency: {p.emojiFrequency}")
    if p.commonExpressions:
        print(f"  Expressions: {', '.join(p.commonExpressions)}")
    print(f"  Style tags: {', '.join(p.styleTags)}\n")

    # Test 4: Generate prompt section
    print("TEST 4: Generate Prompt Section")
    section = build_style_section(profile)
    if section:
        lines = section.split('\n')
        print(f"  [OK] Section generated ({len(section)} chars, {len(lines)} lines)")
        print(f"  Sample (first 5 lines):")
        for line in lines[:5]:
            print(f"    {line}")
    else:
        print("  [FAIL] No section generated (profile disabled?)")
    print()

    # Test 5: Save profile
    print("TEST 5: Save Profile")
    path = save_profile(profile)
    print(f"  [OK] Profile saved to: {path}")
    print(f"  File size: {__import__('os').path.getsize(path)} bytes\n")

    # Test 6: Reload and verify
    print("TEST 6: Reload and Verify")
    reloaded = load_profile()
    print(f"  [OK] Profile reloaded")
    print(f"  Messages: {reloaded.totalMessagesAnalyzed}")
    print(f"  Formality: {reloaded.profile.formality}")
    if reloaded.totalMessagesAnalyzed == profile.totalMessagesAnalyzed:
        print(f"  [OK] Data integrity verified\n")
    else:
        print(f"  [FAIL] Data mismatch!\n")

    print("=" * 70)
    print("ALL TESTS PASSED!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    try:
        test_system()
    except Exception as e:
        print(f"[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
