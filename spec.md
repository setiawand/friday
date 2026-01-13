# Work Management Platform (Monday-like)
## System Specification Document (v1.0)

---

## 1. Purpose
This document defines the **functional, technical, and non-functional specifications** for building a **monday.com-like work management platform**.

The goal is to implement a **board-based work OS** supporting tasks, statuses, views, automations, and collaboration.

This document is **authoritative**. If behavior is not specified here, it is **out of scope** for v1.

---

## 2. Product Scope

### 2.1 In Scope (v1)
- Workspaces
- Boards
- Groups
- Items (rows)
- Columns (schema-driven)
- Table View
- Kanban View
- Basic automations (event → action)
- Users, roles, permissions
- Activity log
- Realtime updates

### 2.2 Explicitly Out of Scope (v1)
- Mobile apps
- Public API
- Marketplace / extensions
- AI features
- Gantt / Timeline view
- Billing / subscriptions
- File storage beyond metadata

---

## 3. Core Domain Model

### 3.1 Workspace
Top-level tenant boundary.

**Fields**
- id (UUID)
- name
- owner_id
- created_at
- is_active

**Rules**
- All boards belong to exactly one workspace
- Users may belong to multiple workspaces

---

### 3.2 User
Represents an authenticated human.

**Fields**
- id
- email
- display_name
- avatar_url
- created_at
- last_login_at

---

### 3.3 Board
Schema-driven container for work items.

**Fields**
- id
- workspace_id
- name
- description
- created_by
- created_at
- archived_at (nullable)

**Rules**
- Boards define their own column schema
- Boards contain groups and items
- Schema changes do not alter DB schema

---

### 3.4 Group
Logical grouping of items inside a board.

**Fields**
- id
- board_id
- name
- position

---

### 3.5 Item
Single unit of work (row).

**Fields**
- id
- board_id
- group_id
- position
- created_by
- created_at
- updated_at
- archived_at (nullable)

**Rules**
- Items have no fixed fields
- All data stored via ColumnValues

---

### 3.6 Column
Defines the schema of a board.

**Fields**
- id
- board_id
- type
- title
- settings (JSON)
- position
- created_at

**Supported Column Types (v1)**
- text
- status
- date
- person

---

### 3.7 ColumnValue
Stores the actual value for an item-column pair.

**Fields**
- id
- item_id
- column_id
- value (JSONB)
- updated_at

**Rules**
- One value per (item_id, column_id)
- Value format depends on column type

---

## 4. Views

### 4.1 Table View
Primary interaction surface.

**Capabilities**
- Inline editing
- Column reordering
- Row reordering
- Bulk selection
- Keyboard navigation

**Constraints**
- Spreadsheet-like UX
- No page reloads

---

### 4.2 Kanban View
Status-based visualization.

**Rules**
- One status column drives Kanban
- Drag-and-drop updates status value
- Status order defined in column settings

---

## 5. Automation Engine

### 5.1 Automation Model
```
WHEN <event>
IF <optional condition>
THEN <action>
```

### 5.2 Supported Events (v1)
- item_created
- column_value_changed
- status_changed
- date_reached

### 5.3 Supported Actions (v1)
- change_column_value
- assign_person
- send_notification
- archive_item

### 5.4 Execution Rules
- Event-driven only (no polling)
- Asynchronous execution
- At-least-once delivery
- Idempotent actions

### 5.5 Failure Handling
- Retry with backoff
- Failures logged
- No cascading failures

---

## 6. Permissions & Access Control

### 6.1 Roles
- Workspace Admin
- Board Owner
- Board Member
- Guest (read-only)

### 6.2 Enforcement Rules
- Server-side enforcement only
- No implicit access
- RBAC applied to every request

### 6.3 Access Matrix (Simplified)

| Action | Admin | Owner | Member | Guest |
|------|------|------|------|------|
| Create board | Yes | No | No | No |
| Edit schema | Yes | Yes | No | No |
| Edit item | Yes | Yes | Yes | No |
| View board | Yes | Yes | Yes | Yes |

---

## 7. Realtime & Collaboration

### 7.1 Realtime Events
- item_updated
- column_value_updated
- item_moved
- automation_executed

### 7.2 Transport
- WebSockets or Server-Sent Events

### 7.3 Rules
- Optimistic UI updates
- Server is source of truth
- Conflict resolution via versioning

---

## 8. Activity & Audit Log

### 8.1 Tracked Actions
- Item create / update / archive
- Status changes
- Automation executions
- Permission changes

### 8.2 Retention
- Minimum 90 days (configurable)

---

## 9. Non-Functional Requirements

### 9.1 Performance
- UI interaction latency < 100ms
- Board load < 2 seconds (10k items)
- Automation execution < 5 seconds

### 9.2 Reliability
- Idempotent APIs
- Retryable workflows
- Graceful degradation

### 9.3 Observability
- Structured logs
- Metrics per service
- Distributed tracing

---

## 10. Technology Assumptions (Guidance Only)
- Frontend: React / Next.js
- Backend: FastAPI or NestJS
- Database: PostgreSQL (JSONB)
- Realtime: WebSockets
- Queue: Redis / RabbitMQ
- Auth: JWT + RBAC

---

## 11. Acceptance Criteria (v1)
The system is considered **v1-complete** when:
- Boards support custom columns
- Items editable inline in table view
- Kanban reflects status changes in realtime
- Automations execute reliably
- Permissions enforced correctly
- Activity logs auditable

---

## 12. Instructions for AI Coding Agents
- Follow this document strictly
- Do not add features beyond scope
- Prefer clarity over cleverness
- Schema-driven design is mandatory
- Automation must be event-based
- Ask clarifying questions if ambiguity exists

---

**End of SPEC.md**

