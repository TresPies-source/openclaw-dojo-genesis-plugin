#!/usr/bin/env python3.11
"""
diff_tracker.py - Track and summarize changes since last sync
Usage: python3.11 diff_tracker.py <repo_path> [last_commit_hash]
Example: python3.11 diff_tracker.py /home/ubuntu/repos/dojo-genesis abc123
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime

def run_git_command(repo_path, command):
    """Run a git command in the repo directory"""
    try:
        result = subprocess.run(
            command,
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ Git command failed: {e.stderr}", file=sys.stderr)
        sys.exit(1)

def get_current_commit(repo_path):
    """Get the current commit hash"""
    return run_git_command(repo_path, ["git", "rev-parse", "HEAD"])

def get_commit_info(repo_path, commit_hash):
    """Get commit information"""
    try:
        info = run_git_command(repo_path, [
            "git", "show", "--no-patch", "--format=%H%n%an%n%ae%n%at%n%s",
            commit_hash
        ])
        lines = info.split('\n')
        return {
            'hash': lines[0],
            'author': lines[1],
            'email': lines[2],
            'timestamp': int(lines[3]),
            'message': lines[4] if len(lines) > 4 else ''
        }
    except:
        return None

def get_diff_summary(repo_path, from_commit, to_commit):
    """Get summary of changes between commits"""
    # Get list of changed files
    files_output = run_git_command(repo_path, [
        "git", "diff", "--name-status", f"{from_commit}..{to_commit}"
    ])
    
    changes = {
        'added': [],
        'modified': [],
        'deleted': [],
        'renamed': []
    }
    
    for line in files_output.split('\n'):
        if not line:
            continue
        parts = line.split('\t')
        status = parts[0]
        filename = parts[1] if len(parts) > 1 else ''
        
        if status == 'A':
            changes['added'].append(filename)
        elif status == 'M':
            changes['modified'].append(filename)
        elif status == 'D':
            changes['deleted'].append(filename)
        elif status.startswith('R'):
            changes['renamed'].append(filename)
    
    return changes

def get_commit_log(repo_path, from_commit, to_commit):
    """Get commit log between two commits"""
    log_output = run_git_command(repo_path, [
        "git", "log", "--oneline", f"{from_commit}..{to_commit}"
    ])
    return log_output.split('\n') if log_output else []

def generate_markdown_summary(repo_path, from_commit, to_commit, changes, commits):
    """Generate a markdown summary of changes"""
    repo_name = Path(repo_path).name
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    from_info = get_commit_info(repo_path, from_commit)
    to_info = get_commit_info(repo_path, to_commit)
    
    md = f"""# Diff Summary: {repo_name}

**Generated:** {current_time}
**From Commit:** `{from_commit[:7]}` ({from_info['message'] if from_info else 'Unknown'})
**To Commit:** `{to_commit[:7]}` ({to_info['message'] if to_info else 'Unknown'})

## Summary

- **Added:** {len(changes['added'])} files
- **Modified:** {len(changes['modified'])} files
- **Deleted:** {len(changes['deleted'])} files
- **Renamed:** {len(changes['renamed'])} files
- **Total Commits:** {len(commits)}

## Commits

"""
    
    for commit in commits:
        md += f"- `{commit}`\n"
    
    if changes['added']:
        md += "\n## Added Files\n\n"
        for f in changes['added']:
            md += f"- `{f}`\n"
    
    if changes['modified']:
        md += "\n## Modified Files\n\n"
        for f in changes['modified']:
            md += f"- `{f}`\n"
    
    if changes['deleted']:
        md += "\n## Deleted Files\n\n"
        for f in changes['deleted']:
            md += f"- `{f}`\n"
    
    if changes['renamed']:
        md += "\n## Renamed Files\n\n"
        for f in changes['renamed']:
            md += f"- `{f}`\n"
    
    return md

def main():
    if len(sys.argv) < 2:
        print("Usage: python3.11 diff_tracker.py <repo_path> [last_commit_hash]")
        print("Example: python3.11 diff_tracker.py /home/ubuntu/repos/dojo-genesis abc123")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    
    if not Path(repo_path).is_dir():
        print(f"❌ Error: {repo_path} is not a directory", file=sys.stderr)
        sys.exit(1)
    
    if not (Path(repo_path) / ".git").is_dir():
        print(f"❌ Error: {repo_path} is not a git repository", file=sys.stderr)
        sys.exit(1)
    
    # Get current commit
    current_commit = get_current_commit(repo_path)
    
    # Determine from_commit
    if len(sys.argv) >= 3:
        from_commit = sys.argv[2]
    else:
        # Default to 10 commits back
        try:
            from_commit = run_git_command(repo_path, ["git", "rev-parse", "HEAD~10"])
        except:
            # If repo has less than 10 commits, use first commit
            from_commit = run_git_command(repo_path, ["git", "rev-list", "--max-parents=0", "HEAD"])
    
    print(f"📊 Analyzing changes from {from_commit[:7]} to {current_commit[:7]}")
    
    # Get diff summary
    changes = get_diff_summary(repo_path, from_commit, current_commit)
    commits = get_commit_log(repo_path, from_commit, current_commit)
    
    # Generate markdown
    markdown = generate_markdown_summary(repo_path, from_commit, current_commit, changes, commits)
    
    print(markdown)
    
    # Also save to file
    output_file = Path(repo_path) / ".diff_summary.md"
    output_file.write_text(markdown)
    print(f"\n✅ Summary saved to: {output_file}")

if __name__ == "__main__":
    main()
