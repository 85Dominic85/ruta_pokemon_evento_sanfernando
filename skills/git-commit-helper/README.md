---
name: Git Commit Helper
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
hooks:
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "echo "[$(date)] Git Commit Helper: Analyzed git diff for commit message" >> ~/.claude/git-commit-helper.log"
---

# Git Commit Helper

## Purpose

Analyze staged git changes and generate high-quality Conventional Commit messages.

---

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- feat
- fix
- docs
- style
- refactor
- test
- chore

---

## Workflow

1. Review staged changes:
   ```bash
   git diff --staged
   ```
2. Identify change type.
3. Determine scope.
4. Write imperative summary (< 50 chars).
5. Add body explaining WHY.
6. Mark breaking changes if applicable.

---

## Conventional Commit Rules

**DO:**
- Use imperative mood
- Keep summary under 50 characters
- Capitalize first letter
- Explain WHY in body

**DON'T:**
- Use vague messages
- Write paragraphs in summary
- Use past tense

---

## Breaking Changes

Indicate clearly:

```
feat(api)!: restructure API response format

BREAKING CHANGE: API responses now follow JSON:API spec
```

---

## Git Commands Reference

```bash
git status
git diff --staged
git diff --staged --stat
git add -p
git commit --amend
```

---

## Commit Checklist

- [ ] Type is correct
- [ ] Scope is specific
- [ ] Summary < 50 chars
- [ ] Imperative mood
- [ ] Body explains WHY
- [ ] Breaking changes marked
