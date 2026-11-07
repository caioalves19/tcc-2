@AGENTS.md

## Claude Code

Mesma constituição do Cursor, neste formato:

| Cursor | Claude Code |
|--------|-------------|
| `AGENTS.md` | este arquivo (`@AGENTS.md`) |
| `.cursor/rules/*.mdc` | `.claude/rules/*.md` |
| `.cursor/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| `.cursor/agents/plan-mode.md` | `.claude/agents/plan-mode.md` |

Ao mudar uma skill, regra ou agent, atualize **os dois lados**.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`caioalves19/tcc-2`, via `gh`). This overrides the global local-markdown default. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
