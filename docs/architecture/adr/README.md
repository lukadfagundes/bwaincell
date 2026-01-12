# Architecture Decision Records (ADR)

**Purpose:** Document significant architectural decisions made during Bwaincell's development

**Format:** Markdown Architectural Decision Records (MADR)

---

## What are ADRs?

Architecture Decision Records (ADRs) are documents that capture important architectural decisions along with their context and consequences. They help:

- **Explain "Why":** Future developers understand the reasoning behind decisions
- **Prevent Revisiting:** Avoid rehashing decisions that were already debated
- **Onboard Contributors:** New team members quickly understand architectural choices
- **Track Evolution:** See how architecture evolved over time
- **Learn from Mistakes:** Document what worked and what didn't

---

## When to Write an ADR

Write an ADR when you make a decision that:

1. **Affects multiple components** (e.g., switching databases, authentication strategy)
2. **Has long-term impact** (e.g., monorepo vs polyrepo)
3. **Involves trade-offs** (e.g., performance vs. simplicity)
4. **Is difficult to reverse** (e.g., framework choice)
5. **Requires explaining to team members** (e.g., why PostgreSQL over MySQL)

**Examples of ADR-worthy decisions:**

- Database choice (SQLite → PostgreSQL)
- Authentication strategy (OAuth2 + JWT)
- Monorepo vs polyrepo
- REST API vs GraphQL
- Deployment platform (Docker, Kubernetes, Serverless)

**Not ADR-worthy:**

- Small implementation details (use X library for date formatting)
- Temporary workarounds
- Coding style preferences (use tabs vs spaces)
- Routine refactoring

---

## ADR Template

Use this template when creating new ADRs:

```markdown
# ADR [number]: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Decision Makers:** [Team, Individual, Committee]

---

## Context

[Describe the problem you're trying to solve]

- What is the issue?
- Why is it important?
- What constraints exist?
- What are the requirements?

---

## Decision

[What you decided to do]

- Clear statement of the decision
- How it will be implemented
- Key components affected

---

## Consequences

### Positive

- [Benefit 1]
- [Benefit 2]

### Negative

- [Trade-off 1]
- [Trade-off 2]

---

## Alternatives Considered

### Alternative 1: [Name]

[Why you didn't choose this]

### Alternative 2: [Name]

[Why you didn't choose this]

---

## References

- [Link to relevant documentation]
- [Related ADRs]
- [External resources]

---

## Revision History

| Date       | Version | Changes          |
| ---------- | ------- | ---------------- |
| YYYY-MM-DD | 1.0     | Initial decision |
```

---

## ADR Lifecycle

### Statuses

- **Proposed:** Decision is being discussed, not yet final
- **Accepted:** Decision has been made and is being implemented
- **Deprecated:** Decision is no longer recommended but not yet replaced
- **Superseded:** Decision has been replaced by a newer ADR

### Updating ADRs

ADRs should be **immutable** (don't edit past decisions). Instead:

1. **Add Revision History:** Document when context changes but decision remains valid
2. **Create New ADR:** If decision is reversed, create new ADR that supersedes old one
3. **Mark Status:** Update status to "Superseded by ADR-XXXX"

**Example:**

```markdown
# ADR 0002: Migration from SQLite to PostgreSQL 15

**Status:** Accepted (Superseded by ADR 0010: Migration to MySQL 8.0)
**Date:** 2026-01-11

[Original content remains unchanged]

---

**Note:** This ADR was superseded on 2027-06-15 by [ADR 0010](0010-migration-to-mysql.md) due to [reason].
```

---

## Current ADRs

### Active Decisions

| ADR                                       | Title                                                | Status   | Date       |
| ----------------------------------------- | ---------------------------------------------------- | -------- | ---------- |
| [0001](0001-monorepo-architecture.md)     | Monorepo Architecture with npm Workspaces            | Accepted | 2026-01-11 |
| [0002](0002-postgresql-migration.md)      | Migration from SQLite to PostgreSQL 15               | Accepted | 2026-01-11 |
| [0003](0003-oauth2-jwt-authentication.md) | OAuth2 + JWT Authentication Strategy                 | Accepted | 2026-01-11 |
| [0004](0004-discord-bot-rest-api.md)      | Dual Interface Architecture (Discord Bot + REST API) | Accepted | 2026-01-11 |

### Index by Category

#### Infrastructure & Deployment

- [ADR 0001: Monorepo Architecture](0001-monorepo-architecture.md)

#### Database

- [ADR 0002: PostgreSQL Migration](0002-postgresql-migration.md)

#### Security & Authentication

- [ADR 0003: OAuth2 + JWT Authentication](0003-oauth2-jwt-authentication.md)

#### Architecture Patterns

- [ADR 0004: Dual Interface Architecture](0004-discord-bot-rest-api.md)

---

## Creating a New ADR

### Step 1: Determine ADR Number

```bash
# List existing ADRs
ls docs/architecture/adr/

# Use next sequential number
# If last ADR is 0004, new ADR is 0005
```

### Step 2: Create ADR File

```bash
# Create new ADR file
touch docs/architecture/adr/0005-my-decision-title.md

# Copy template
cat docs/architecture/adr/template.md > docs/architecture/adr/0005-my-decision-title.md
```

### Step 3: Write ADR

Follow the [ADR Template](#adr-template) above. Include:

- **Context:** What problem are you solving?
- **Decision:** What did you decide?
- **Consequences:** What are the trade-offs?
- **Alternatives:** What else did you consider?

### Step 4: Get Feedback

```bash
# Create PR with ADR
git checkout -b adr/0005-my-decision
git add docs/architecture/adr/0005-my-decision-title.md
git commit -m "docs: Add ADR 0005 - My Decision Title"
git push origin adr/0005-my-decision

# Open PR for team review
```

### Step 5: Update This README

Add new ADR to the [Current ADRs](#current-adrs) table:

```markdown
| [0005](0005-my-decision-title.md) | My Decision Title | Accepted | 2026-01-15 |
```

---

## ADR Best Practices

### 1. Keep ADRs Concise

- **Target:** 1-3 pages
- Focus on decision and reasoning, not implementation details
- Link to implementation documentation

### 2. Write for Future You

- Assume reader has no context
- Explain acronyms and terms
- Include enough background to understand decision

### 3. Document Alternatives

- List at least 2-3 alternatives considered
- Explain why they weren't chosen
- Include trade-offs

### 4. Be Honest About Trade-Offs

- Every decision has downsides
- Document negative consequences upfront
- Include mitigation strategies

### 5. Use Consistent Format

- Follow the template
- Use same heading structure
- Include revision history table

### 6. Link Related ADRs

- Reference ADRs that affect this decision
- Note ADRs that this decision affects
- Create a decision graph

### 7. Update Status

- Mark deprecated ADRs clearly
- Link to superseding ADR
- Don't delete old ADRs (they're historical record)

---

## Common Mistakes

### ❌ Don't:

- **Rewrite history:** Don't edit accepted ADRs (add new ADR instead)
- **Write essays:** Keep ADRs concise (1-3 pages)
- **Skip alternatives:** Always document what you considered
- **Omit trade-offs:** Every decision has downsides
- **Write too late:** Write ADR when decision is made, not months later

### ✅ Do:

- **Write promptly:** Create ADR within 1 week of decision
- **Get feedback:** Review ADR with team before marking "Accepted"
- **Link context:** Reference design docs, GitHub issues, PRs
- **Update README:** Add new ADR to index
- **Be specific:** Name concrete technologies, not abstract concepts

---

## References

- [Markdown Architectural Decision Records (MADR)](https://adr.github.io/madr/)
- [Architecture Decision Records (Michael Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Why Write ADRs](https://github.blog/2020-08-13-why-write-adrs/)
- [ADR GitHub Organization](https://adr.github.io/)

---

## Questions?

If you have questions about ADRs or need help writing one:

1. Review existing ADRs for examples
2. Check [MADR documentation](https://adr.github.io/madr/)
3. Ask in project Discord/Slack
4. Open a GitHub issue for discussion

---

**Last Updated** 2026-01-12
**Total ADRs:** 4
**Next ADR Number:** 0005
