# Friday App

A monday.com-like work management platform.

## Prerequisites

- Node.js (v18+)
- npm

## Setup

1. Install dependencies (ensure you are in the root directory):
   ```bash
   npm install
   ```
   *Note: If you encounter missing module errors, try running `npm install` again to ensure all workspace dependencies are linked.*

2. Start the development server (runs both client and server):
   ```bash
   npm run dev
   ```

## Architecture

- **apps/client**: Next.js frontend
- **apps/server**: NestJS backend
- **apps/server/src/entities**: Core domain models
- **apps/server/src/automations**: Automation engine using NestJS Event Emitter

## Features (v1)

- Workspaces, Boards, Groups, Items, Columns
- Table View with inline editing
- Real-time updates (via optimistic UI and backend events)
- Automation Engine (e.g., auto-archive when status is 'Done')
