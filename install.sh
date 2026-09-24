#!/usr/bin/env bash
set -e

# Universal Multi-Agent Installer for Portfolio Interview Skill
# Supports: Claude Code, Google Antigravity, Gemini CLI, Cursor, Windsurf, Codex

echo "🚀 Installing Portfolio Interview Agent Skill..."

SKILL_NAME="portfolio-interview"
REPO_URL="https://github.com/imMamdouhaboammar/portfolio-interview.git"
INSTALL_COUNT=0

# 1. Claude Code
if [ -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude/skills"
  if [ -d "$HOME/.claude/skills/$SKILL_NAME" ]; then
    echo "  ↻ Updating Claude Code skill..."
    (cd "$HOME/.claude/skills/$SKILL_NAME" && git pull --quiet origin main 2>/dev/null || true)
  else
    echo "  + Installing into Claude Code..."
    git clone --quiet "$REPO_URL" "$HOME/.claude/skills/$SKILL_NAME"
  fi
  INSTALL_COUNT=$((INSTALL_COUNT + 1))
fi

# 2. Google Antigravity & Gemini CLI
if [ -d "$HOME/.gemini" ]; then
  mkdir -p "$HOME/.gemini/config/skills"
  if [ -d "$HOME/.gemini/config/skills/$SKILL_NAME" ]; then
    echo "  ↻ Updating Antigravity / Gemini CLI skill..."
    (cd "$HOME/.gemini/config/skills/$SKILL_NAME" && git pull --quiet origin main 2>/dev/null || true)
  else
    echo "  + Installing into Antigravity / Gemini CLI..."
    git clone --quiet "$REPO_URL" "$HOME/.gemini/config/skills/$SKILL_NAME"
  fi
  INSTALL_COUNT=$((INSTALL_COUNT + 1))
fi

# 3. OpenAI Codex
if [ -d "$HOME/.codex" ]; then
  mkdir -p "$HOME/.codex/skills"
  if [ -d "$HOME/.codex/skills/$SKILL_NAME" ]; then
    echo "  ↻ Updating Codex skill..."
    (cd "$HOME/.codex/skills/$SKILL_NAME" && git pull --quiet origin main 2>/dev/null || true)
  else
    echo "  + Installing into Codex..."
    git clone --quiet "$REPO_URL" "$HOME/.codex/skills/$SKILL_NAME"
  fi
  INSTALL_COUNT=$((INSTALL_COUNT + 1))
fi

# 4. OpenCode, Cursor, Windsurf & Codex global (~/.agents/skills)
if [ -d "$HOME/.agents" ]; then
  mkdir -p "$HOME/.agents/skills"
  if [ -d "$HOME/.agents/skills/$SKILL_NAME" ]; then
    echo "  ↻ Updating OpenCode / Cursor / Windsurf skill..."
    (cd "$HOME/.agents/skills/$SKILL_NAME" && git pull --quiet origin main 2>/dev/null || true)
  else
    echo "  + Installing into OpenCode / Cursor / Windsurf..."
    git clone --quiet "$REPO_URL" "$HOME/.agents/skills/$SKILL_NAME"
  fi
  INSTALL_COUNT=$((INSTALL_COUNT + 1))
fi

# 5. Agent Kernel
if [ -d "$HOME/.agent-kernel" ]; then
  mkdir -p "$HOME/.agent-kernel/skills"
  if [ -d "$HOME/.agent-kernel/skills/$SKILL_NAME" ]; then
    echo "  ↻ Updating Agent Kernel skill..."
    (cd "$HOME/.agent-kernel/skills/$SKILL_NAME" && git pull --quiet origin main 2>/dev/null || true)
  else
    echo "  + Installing into Agent Kernel..."
    git clone --quiet "$REPO_URL" "$HOME/.agent-kernel/skills/$SKILL_NAME"
  fi
  INSTALL_COUNT=$((INSTALL_COUNT + 1))
fi

# Fallback: If no recognized agent harness folder exists yet, install to default ~/.agents/skills
if [ "$INSTALL_COUNT" -eq 0 ]; then
  mkdir -p "$HOME/.agents/skills"
  echo "  + Installing to default ~/.agents/skills..."
  git clone --quiet "$REPO_URL" "$HOME/.agents/skills/$SKILL_NAME"
  INSTALL_COUNT=1
fi

echo "✨ Portfolio Interview Skill installation completed across $INSTALL_COUNT environments!"
