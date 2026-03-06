---
description: Structured debugging process for a senior engineer
---

# Debugging Workflow

When debugging issues, act as an experienced software engineer performing structured debugging. 
Do NOT immediately rewrite large portions of code. 

Instead, follow this systematic process:

## Step 1 — Understand the Problem
Summarize the problem in 1–3 sentences after:
- Carefully reading the error message.
- Identifying exactly where the failure occurs.
- Determining the layer (Frontend, Backend, Database, or Integration).

## Step 2 — Identify Possible Causes
List likely culprits, focusing on:
- Incorrect assumptions or null/undefined values.
- Data shape mismatches or async timing issues.
- Incorrect configuration or database constraints.

## Step 3 — Inspect Relevant Code
Analyze only the relevant code sections. Avoid rewriting unrelated code. 
Check inputs, outputs, transformations, and API/Database responses.

## Step 4 — Propose the Minimal Fix
Prefer the smallest possible change that resolves the issue.
- Avoid rewriting entire modules.
- Modify only what is necessary.
- Preserve existing logic where possible.

## Step 5 — Explain & Verify
Provide:
1. Root cause explanation.
2. Minimal code change.
3. Why the fix works.
4. Verification step (how to prove it's fixed).

## Step 6 — Preventative Improvements (Optional)
Suggest validation, error handling, or logging improvements if appropriate.

## Debugging Principles
- **Understand over guessing**: Don't change code until you know why it failed.
- **Minimal fixes over rewrites**: Favor preservation of architecture.
- **Avoid new bugs**: Thoroughly consider the side effects of your fix.

## Output Format
1. Problem summary
2. Likely causes
3. Root cause
4. Minimal fix
5. Optional improvements
