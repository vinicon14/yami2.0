#!/bin/bash
# Pre-commit hook for YAMI Parity Rule enforcement
# Validates that new features maintain voice-chat parity
#
# Installation:
# cp .opencode/hooks/parity-check.pre-commit.sh .git/hooks/pre-commit
# chmod +x .git/hooks/pre-commit

set -e

echo ""
echo "🔍 YAMI Parity Check (Regra 1: Paridade Total)"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PARITY_ISSUES=0
PARITY_WARNINGS=0

# Check if parity validation script exists
if [ ! -f "scripts/validate-parity.ts" ]; then
    echo -e "${YELLOW}⚠️  Parity validator not found${NC}"
    exit 0
fi

# Run parity validation
echo "Validating command and tool registry..."

# Check for voice-only or chat-only tools
VOICE_ONLY=$(git diff --cached --name-only | grep -E "skills/.*voice.*\.(ts|js)$" || true)
CHAT_ONLY=$(git diff --cached --name-only | grep -E "skills/.*chat.*\.(ts|js)$" || true)

if [ -n "$VOICE_ONLY" ]; then
    echo -e "${RED}❌ Found voice-only changes without chat equivalent:${NC}"
    echo "$VOICE_ONLY"
    PARITY_ISSUES=$((PARITY_ISSUES + 1))
fi

if [ -n "$CHAT_ONLY" ]; then
    echo -e "${RED}❌ Found chat-only changes without voice equivalent:${NC}"
    echo "$CHAT_ONLY"
    PARITY_ISSUES=$((PARITY_ISSUES + 1))
fi

# Check for test coverage
STAGED_SKILLS=$(git diff --cached --name-only | grep -E "^skills/" | grep -v test | cut -d/ -f2 | sort -u || true)

for skill in $STAGED_SKILLS; do
    if [ -f "runtime/core/src/commands/${skill}.ts" ]; then
        if [ ! -f "runtime/core/src/commands/__tests__/${skill}.parity.test.ts" ]; then
            echo -e "${YELLOW}⚠️  Missing parity tests for ${skill}${NC}"
            PARITY_WARNINGS=$((PARITY_WARNINGS + 1))
        fi
    fi
done

# Check parity metadata in staged files
echo ""
echo "Checking parity metadata in staged files..."

MISSING_PARITY=0
while IFS= read -r file; do
    if [[ $file == *.ts && ! $file == *test* ]]; then
        if grep -q "export.*Tool\|export.*CommandEntry" "$file"; then
            if ! grep -q "parity:" "$file"; then
                echo -e "${RED}❌ Missing parity metadata in: $file${NC}"
                MISSING_PARITY=$((MISSING_PARITY + 1))
            fi
        fi
    fi
done < <(git diff --cached --name-only)

if [ $MISSING_PARITY -gt 0 ]; then
    PARITY_ISSUES=$((PARITY_ISSUES + MISSING_PARITY))
fi

# Summary
echo ""
echo "================================================"

if [ $PARITY_ISSUES -eq 0 ] && [ $PARITY_WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Parity check passed!${NC}"
    echo ""
    exit 0
elif [ $PARITY_ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $PARITY_WARNINGS parity warnings${NC}"
    echo ""
    echo "Review and fix, or commit with --no-verify (not recommended):"
    echo "  git commit --no-verify -m 'message'"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Parity check failed: $PARITY_ISSUES issues${NC}"
    echo ""
    echo "This commit violates the Parity Rule (Regra 1)."
    echo "Review: PARITY_RULE.md"
    echo ""
    echo "Every new feature must support BOTH chat and voice."
    echo "If you need an exception, document it in the commit message:"
    echo "  [PARITY EXCEPTION] reason"
    echo ""
    exit 1
fi
