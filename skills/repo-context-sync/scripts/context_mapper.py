#!/usr/bin/env python3.11
"""
context_mapper.py - Generate codebase overview for task context
Usage: python3.11 context_mapper.py <repo_path> [focus_keywords...]
Example: python3.11 context_mapper.py /home/ubuntu/repos/dojo-genesis agent routing supervisor
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime
import json

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
    except subprocess.CalledProcessError:
        return ""

def get_repo_info(repo_path):
    """Get basic repo information"""
    current_branch = run_git_command(repo_path, ["git", "branch", "--show-current"])
    current_commit = run_git_command(repo_path, ["git", "rev-parse", "HEAD"])
    commit_message = run_git_command(repo_path, ["git", "log", "-1", "--pretty=%s"])
    remote_url = run_git_command(repo_path, ["git", "config", "--get", "remote.origin.url"])
    
    return {
        'name': Path(repo_path).name,
        'path': repo_path,
        'branch': current_branch,
        'commit': current_commit[:7] if current_commit else 'unknown',
        'commit_message': commit_message,
        'remote_url': remote_url
    }

def generate_tree(repo_path, max_depth=3, exclude_patterns=None):
    """Generate a tree view of the repo structure"""
    if exclude_patterns is None:
        exclude_patterns = ['.git', 'node_modules', '__pycache__', '.next', 'dist', 'build', '.venv', 'venv']
    
    def should_exclude(path):
        return any(pattern in str(path) for pattern in exclude_patterns)
    
    def tree_recursive(path, prefix="", depth=0):
        if depth >= max_depth:
            return []
        
        lines = []
        try:
            items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name))
            items = [item for item in items if not should_exclude(item)]
            
            for i, item in enumerate(items):
                is_last = i == len(items) - 1
                current_prefix = "└── " if is_last else "├── "
                next_prefix = "    " if is_last else "│   "
                
                if item.is_dir():
                    lines.append(f"{prefix}{current_prefix}{item.name}/")
                    lines.extend(tree_recursive(item, prefix + next_prefix, depth + 1))
                else:
                    lines.append(f"{prefix}{current_prefix}{item.name}")
        except PermissionError:
            pass
        
        return lines
    
    root = Path(repo_path)
    tree_lines = [f"{root.name}/"]
    tree_lines.extend(tree_recursive(root, "", 0))
    return "\n".join(tree_lines)

def find_relevant_files(repo_path, keywords):
    """Find files relevant to the given keywords"""
    if not keywords:
        return []
    
    # Use git grep to find files containing keywords
    relevant_files = set()
    
    for keyword in keywords:
        try:
            result = subprocess.run(
                ["git", "grep", "-l", "-i", keyword],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                files = result.stdout.strip().split('\n')
                relevant_files.update([f for f in files if f])
        except:
            pass
    
    return sorted(list(relevant_files))

def extract_file_summary(file_path, max_lines=20):
    """Extract a summary from a file (first few lines or key sections)"""
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        lines = content.split('\n')
        
        # For markdown files, extract headers
        if file_path.suffix == '.md':
            headers = [line for line in lines if line.startswith('#')]
            if headers:
                return '\n'.join(headers[:10])
        
        # For code files, extract imports and main definitions
        if file_path.suffix in ['.py', '.js', '.ts', '.tsx', '.jsx']:
            relevant_lines = []
            for line in lines[:max_lines]:
                stripped = line.strip()
                if stripped.startswith(('import ', 'from ', 'export ', 'class ', 'function ', 'def ', 'async def ')):
                    relevant_lines.append(line)
            if relevant_lines:
                return '\n'.join(relevant_lines)
        
        # Default: return first few non-empty lines
        non_empty = [line for line in lines[:max_lines] if line.strip()]
        return '\n'.join(non_empty[:10])
    except:
        return "(Unable to read file)"

def detect_patterns(repo_path):
    """Detect common patterns in the codebase"""
    patterns = {
        'languages': set(),
        'frameworks': set(),
        'file_structure': []
    }
    
    root = Path(repo_path)
    
    # Detect languages by file extensions
    for ext in ['.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.rs', '.java', '.rb']:
        if list(root.rglob(f'*{ext}')):
            patterns['languages'].add(ext[1:])
    
    # Detect frameworks by config files
    framework_markers = {
        'package.json': 'Node.js',
        'requirements.txt': 'Python',
        'Cargo.toml': 'Rust',
        'go.mod': 'Go',
        'next.config.js': 'Next.js',
        'vite.config.ts': 'Vite',
        'tsconfig.json': 'TypeScript'
    }
    
    for marker, framework in framework_markers.items():
        if (root / marker).exists():
            patterns['frameworks'].add(framework)
    
    # Detect file structure patterns (e.g., /00_Roadmap/, /01_PRDs/)
    for item in root.iterdir():
        if item.is_dir() and item.name.startswith(('00_', '01_', '02_', '03_', '04_', '05_')):
            patterns['file_structure'].append(item.name)
    
    return patterns

def generate_context_summary(repo_path, keywords=None):
    """Generate a comprehensive context summary"""
    repo_info = get_repo_info(repo_path)
    tree = generate_tree(repo_path)
    patterns = detect_patterns(repo_path)
    relevant_files = find_relevant_files(repo_path, keywords) if keywords else []
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    md = f"""# Repo Context Summary: {repo_info['name']}

**Generated:** {current_time}
**Path:** `{repo_info['path']}`
**Branch:** `{repo_info['branch']}`
**Commit:** `{repo_info['commit']}` - {repo_info['commit_message']}
**Remote:** {repo_info['remote_url']}

## File Structure

```
{tree}
```

## Detected Patterns

**Languages:** {', '.join(patterns['languages']) if patterns['languages'] else 'None detected'}
**Frameworks:** {', '.join(patterns['frameworks']) if patterns['frameworks'] else 'None detected'}
"""
    
    if patterns['file_structure']:
        md += f"**File Hierarchy Pattern:** {', '.join(patterns['file_structure'])}\n"
    
    if keywords:
        md += f"\n## Relevant Files (Keywords: {', '.join(keywords)})\n\n"
        if relevant_files:
            md += f"Found {len(relevant_files)} relevant files:\n\n"
            for file in relevant_files[:20]:  # Limit to first 20
                md += f"- `{file}`\n"
            
            if len(relevant_files) > 20:
                md += f"\n... and {len(relevant_files) - 20} more files\n"
            
            # Show summaries for top 5 files
            md += "\n### File Summaries (Top 5)\n\n"
            for file in relevant_files[:5]:
                file_path = Path(repo_path) / file
                if file_path.exists():
                    md += f"#### `{file}`\n\n```\n"
                    md += extract_file_summary(file_path)
                    md += "\n```\n\n"
        else:
            md += "No files found matching the keywords.\n"
    
    return md

def main():
    if len(sys.argv) < 2:
        print("Usage: python3.11 context_mapper.py <repo_path> [focus_keywords...]")
        print("Example: python3.11 context_mapper.py /home/ubuntu/repos/dojo-genesis agent routing supervisor")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    keywords = sys.argv[2:] if len(sys.argv) > 2 else None
    
    if not Path(repo_path).is_dir():
        print(f"❌ Error: {repo_path} is not a directory", file=sys.stderr)
        sys.exit(1)
    
    print(f"🗺️  Mapping context for: {Path(repo_path).name}")
    if keywords:
        print(f"🎯 Focus keywords: {', '.join(keywords)}")
    
    summary = generate_context_summary(repo_path, keywords)
    print(summary)
    
    # Save to file
    output_file = Path(repo_path) / ".context_summary.md"
    output_file.write_text(summary)
    print(f"\n✅ Context summary saved to: {output_file}")

if __name__ == "__main__":
    main()
