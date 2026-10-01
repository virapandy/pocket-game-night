#!/bin/sh
# Sets up the workspace folder that holds both clones, so Claude Code opened there works as the
# orchestrator with the coder and tester subagents. See CLAUDE.md in this folder. Safe to re-run.
#
# New machine:
#   mkdir Game_On && cd Game_On
#   git clone https://github.com/virapandy/pocket-game-night.git
#   sh pocket-game-night/.claude/workspace/setup.sh
set -e
REPO=https://github.com/virapandy/pocket-game-night.git
BUILD=$(cd "$(dirname "$0")/../.." && pwd)
NAME=$(basename "$BUILD")
WS=$(dirname "$BUILD")
TEST="$WS/$NAME-testing"
PRODUCT="$WS/$NAME-product"

[ -d "$TEST/.git" ] || git clone "$REPO" "$TEST"
[ -d "$PRODUCT/.git" ] || git clone "$REPO" "$PRODUCT"
for dir in "$BUILD" "$TEST" "$PRODUCT"; do git -C "$dir" config core.hooksPath .githooks; done

# Links, not copies, so a git pull in the Build clone updates the workspace rules too.
link() { # link <target, relative to the link's folder> <link path>
  if [ -e "$2" ] && [ ! -L "$2" ]; then echo "Skipped $2: a real file is there. Move it away and run again."; return; fi
  ln -sfn "$1" "$2" && echo "Linked $2"
}
mkdir -p "$WS/.claude"
link "$NAME/.claude/workspace/CLAUDE.md" "$WS/CLAUDE.md"
link "../$NAME/.claude/workspace/settings.json" "$WS/.claude/settings.json"
link "../$NAME/.claude/workspace/agents" "$WS/.claude/agents"
# The product owner's chat (desktop app in the Product clone) calls the ux-designer helper from here.
# The link is local to that clone, kept out of git through .git/info/exclude.
link "workspace/agents" "$PRODUCT/.claude/agents"
grep -qx '/.claude/agents' "$PRODUCT/.git/info/exclude" 2>/dev/null || echo '/.claude/agents' >> "$PRODUCT/.git/info/exclude"
echo "Done. Open $WS in VS Code and start Claude Code there to orchestrate."
echo "Product owner: open $PRODUCT (or $WS) in the Claude desktop app."
