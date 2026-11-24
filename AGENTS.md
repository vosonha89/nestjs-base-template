# AGENTS.md

## Plan output format (non-negotiable)

Applies to every plan/spec document produced after planning (e.g. CreatePlan output). Does not apply to README or docs/.

- First line: one `# Title`.
- Sections: Summary, Key Changes (grouped by subsystem), Test Plan, Risks & Mitigations, Assumptions, Rejected Alternatives. Include only sections relevant to the change size.
- Every section leads with a table; max 6 columns, cells ≤ 12 words.
- Actionable sections (Summary, Key Changes, Test Plan, Risk mitigations) also carry a `- [ ]` checklist: one item per table row, same order and numbering.
- Standard columns for work items: `# | Item | Files | Depends on | Verification`.
- Checklist items must be verifiable; tick them as work completes.
- Informational sections (Assumptions, Rejected Alternatives) may be table-only.