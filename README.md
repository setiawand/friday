# Friday App

A monday.com-like work management platform built as a monorepo with a Next.js frontend and NestJS backend.

## Prerequisites

- Node.js (v18+)
- npm

## Getting Started

1. Install dependencies (from the repo root):
   ```bash
   npm install
   ```

2. Start the development servers (client + API):
   ```bash
   npm run dev
   ```

3. Open the app in your browser:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002

## Architecture

- **apps/client**: Next.js frontend
- **apps/server**: NestJS backend
- **apps/server/src/entities**: Core domain models
- **apps/server/src/automations**: Automation engine using NestJS Event Emitter
- **apps/server/src/activity-logs**: Activity log persistence and retrieval
- **apps/server/src/workspaces**: Workspace seeding and management

## Features (v1)

- Workspaces, Boards, Groups, Items, Columns
- Table view with inline editing
- Kanban view with drag-and-drop
- Timeline / Gantt-style view using Date and End Date columns
- Real-time updates for items and column values
- Automation engine (e.g., auto-archive when status is Done)
- Activity log for key item events
- Basic authentication with login/register and default admin user

## Default Admin

For local development, a default admin user is seeded:

- Email: `admin@friday.app`
- Password: `admin`

## Linting

You can run linting for the frontend:

```bash
npm run lint -w apps/client
```

And for the backend:

```bash
npm run lint -w apps/server
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
