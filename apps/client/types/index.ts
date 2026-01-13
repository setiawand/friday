export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  is_active: boolean;
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
}

export enum ColumnType {
  TEXT = 'text',
  STATUS = 'status',
  DATE = 'date',
  PERSON = 'person',
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
