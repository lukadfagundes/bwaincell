# Architecture Documentation

System architecture, design decisions, and technical specifications.

## Available Documentation

- **[Architecture Overview](overview.md)** - Complete system architecture, tech stack, and design decisions
- **[Database Schema](database-schema.md)** - PostgreSQL schema with Sequelize models, ER diagram, and query patterns (6 models)
- **[Architecture Diagrams](diagrams.md)** - Visual documentation with 6 Mermaid diagrams: System Architecture, Component Interaction, Database ER, Authentication Flow, Deployment Architecture, Data Flow

## Architecture Topics

### System Design

- [Architecture Overview](overview.md) - High-level system architecture
- [Database Schema](database-schema.md) - PostgreSQL schema, models, indexes, and query patterns
- API Design - REST API architecture (See [../api/](../api/))
- Authentication Flow - Google OAuth + JWT (See overview.md)

### Technology Stack

- Backend Stack - Discord.js + Express + Sequelize (See overview.md)
- Frontend Stack - Next.js + React Query + Zustand (See overview.md)
- Shared Types - TypeScript monorepo architecture (See overview.md)
- Deployment - Raspberry Pi + Vercel (See overview.md)

### Design Patterns

- Monorepo Architecture - Workspace structure (See overview.md)
- Three-Interface Pattern - Discord Bot + API + PWA (See overview.md)
- User Isolation - Data segregation by user_id + guild_id (See overview.md)
- Authentication - OAuth + JWT flow (See overview.md)

## Related Documentation

- [Getting Started](../guides/getting-started.md)
- [API Documentation](../api/)
- [Reference](../reference/)
