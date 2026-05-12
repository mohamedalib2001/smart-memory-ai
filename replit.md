# SmartMemoryAI

## Overview

SmartMemoryAI is a comprehensive multi-tenant SaaS platform for intelligent document archiving and management. Features include:
- Bilingual support (English/Arabic)
- Smart document classification with AI
- Subscription-based pricing with Stripe integration
- Role-based access control (Owner, Admin, Editor, Viewer)
- Document versioning and version history
- Automated reminders system
- Multi-channel notifications (in-app, email)
- Audit logging for compliance
- GitHub integration for code syncing

## User Preferences

Preferred communication style: Simple, everyday language.

## Deployment

### VPS Deployment (91.98.166.125:4103)
- Deployment scripts in `scripts/` directory
- Full documentation in `DEPLOYMENT.md`
- Uses PM2 for process management
- SSL via Nginx + Let's Encrypt

### Replit Publishing
- Alternative easy deployment using Replit's publish feature
- Automatic SSL, health checks, and zero-downtime deploys

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom futuristic dark theme (neon cyan, electric purple palette)
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for neural loader and page transitions
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: REST endpoints under `/api/*` prefix
- **Build Tool**: Vite for client, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Core Tables**: tenants, tenantMembers, users, documents, documentVersions, reminders, notifications, auditLogs, subscriptions, plans

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations
- **Features**: Document auto-classification, type detection, tag suggestions
- **Endpoint**: `/api/documents/classify`

### Shared Code Pattern
The `shared/` directory contains code used by both client and server:
- `schema.ts`: Database schema and Zod validation schemas
- `routes.ts`: API route definitions with type-safe contracts

### Development Setup
- Run `npm run dev` to start the development server
- Run `npm run db:push` to sync database schema
- Vite provides HMR for frontend development

## External Dependencies

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable
- **Connection**: `pg` Pool with Drizzle ORM wrapper

### GitHub Integration
- **Replit GitHub Connector**: Uses Replit's connector API for OAuth tokens
- **Octokit REST**: GitHub API client for repository operations
- **Repository**: mohamedalib2001/SmartMemoryAI
- **Sync Feature**: Endpoint to push code changes to GitHub

### Key NPM Packages
- `@tanstack/react-query`: Data fetching and caching
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `framer-motion`: Animations
- `@radix-ui/*`: Accessible UI primitives
- `zod`: Runtime type validation
- `openai`: AI document classification
- `stripe` / `stripe-replit-sync`: Payment processing

## Recent Changes

- **2026-01-14**: Added AI document classification with OpenAI integration
- **2026-01-14**: Implemented reminders system with CRUD operations
- **2026-01-14**: Created VPS deployment scripts and documentation
- **2026-01-14**: Multi-channel notifications system (in-app, email)
- **2026-01-13**: Document versioning and version history
- **2026-01-12**: Stripe payment integration with subscription plans