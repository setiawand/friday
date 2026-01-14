# Contributing to Friday App

Thanks for your interest in contributing to Friday App. This document describes how to get set up locally and the basic expectations for contributions.

## Local Development

1. Clone the repository and install dependencies from the root:
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```

3. Open the app:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002

## Project Structure

- `apps/client`: Next.js frontend
- `apps/server`: NestJS backend
- Shared concepts:
  - Boards, Groups, Items, Columns
  - Automations and Activity Logs

## Coding Guidelines

- Use TypeScript consistently across client and server.
- Follow the existing patterns in nearby files for state management, API calls, and NestJS modules.
- Avoid introducing new libraries if an equivalent already exists in the codebase.

### Linting

Run linting before opening a pull request:

- Frontend:
  ```bash
  npm run lint -w apps/client
  ```

- Backend:
  ```bash
  npm run lint -w apps/server
  ```

Address reported errors where possible. Existing warnings that are unrelated to your changes can be left as is, but avoid introducing new ones.

## Git and Branches

- Create feature branches from the main branch.
- Use descriptive branch names, for example:
  - `feat/timeline-improvements`
  - `fix/board-creation-error`
  - `chore/update-readme`

## Pull Requests

When opening a pull request:

- Describe the motivation and what was changed.
- Mention any new environment variables or configuration needed.
- Note how you tested the change (manual steps, linting, etc.).

## Adding Features

- Reuse existing abstractions when possible (e.g., board APIs, item value updates).
- Keep backend and frontend changes aligned, especially for new APIs or events.
- For significant UI changes, keep components small and focused, and mirror existing patterns for state and data fetching.

