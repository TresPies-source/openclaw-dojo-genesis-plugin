#!/bin/bash
# smart_clone.sh - Efficient sparse checkout of relevant directories from a GitHub repo
# Usage: smart_clone.sh <repo_url> <local_path> [dir1] [dir2] ...
# Example: smart_clone.sh https://github.com/user/repo /home/ubuntu/repos/repo /00_Roadmap/ /02_Specs/

set -e

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <repo_url> <local_path> [dir1] [dir2] ..."
    echo "Example: $0 https://github.com/user/repo /home/ubuntu/repos/repo /00_Roadmap/ /02_Specs/"
    exit 1
fi

REPO_URL="$1"
LOCAL_PATH="$2"
shift 2
DIRS=("$@")

echo "🔍 Smart Clone: $REPO_URL"
echo "📁 Target: $LOCAL_PATH"

# Check if directory already exists
if [ -d "$LOCAL_PATH/.git" ]; then
    echo "✅ Repo already cloned. Fetching latest changes..."
    cd "$LOCAL_PATH"
    git fetch origin
    git pull origin main || git pull origin master
    echo "✅ Updated successfully"
    exit 0
fi

# Create parent directory if needed
mkdir -p "$(dirname "$LOCAL_PATH")"

# Clone with sparse checkout
echo "📥 Cloning with sparse checkout..."
git clone --filter=blob:none --sparse "$REPO_URL" "$LOCAL_PATH"
cd "$LOCAL_PATH"

# If specific directories provided, configure sparse checkout
if [ ${#DIRS[@]} -gt 0 ]; then
    echo "🎯 Configuring sparse checkout for:"
    for dir in "${DIRS[@]}"; do
        echo "   - $dir"
        git sparse-checkout add "$dir"
    done
else
    echo "📦 No specific directories provided, checking out full repo"
    git sparse-checkout disable
fi

echo "✅ Clone complete: $LOCAL_PATH"
