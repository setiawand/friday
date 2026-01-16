export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  is_admin?: boolean;
}

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  archived_at?: string;
  columns?: Column[];
  groups?: Group[];
}

export interface Group {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

export interface Item {
  id: string;
  board_id: string;
  group_id: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  column_values?: ColumnValue[];
  parent_item_id?: string | null;
}

export enum ColumnType {
  TEXT = 'text',
  STATUS = 'status',
  DATE = 'date',
  PERSON = 'person',
  NUMBERS = 'numbers',
  FILES = 'files',
}

export interface Column {
  id: string;
  board_id: string;
  type: ColumnType;
  title: string;
  settings: Record<string, any>;
  position: number;
  created_at: string;
}

export interface ColumnValue {
  id: string;
  item_id: string;
  column_id: string;
  value: any;
  updated_at: string;
}

export interface Update {
  id: string;
  item_id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: User;
}

export interface ActivityLog {
  id: string;
  board_id: string;
  item_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

export interface File {
  id: string;
  item_id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
  user_id: string;
  user?: User;
  created_at: string;
}

export interface TimeLog {
  id: string;
  item_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  is_running: boolean;
  created_at: string;
  user?: User;
}

export interface ItemDependency {
  id: string;
  from_item_id: string;
  to_item_id: string;
  type: string;
  created_at: string;
}
