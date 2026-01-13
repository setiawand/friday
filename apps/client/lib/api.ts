const API_URL = 'http://localhost:3002';

export async function fetchBoards() {
  const res = await fetch(`${API_URL}/boards`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function fetchBoard(id: string) {
  const res = await fetch(`${API_URL}/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function createBoard(data: any) {
  const res = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function fetchWorkspaces() {
  const res = await fetch(`${API_URL}/workspaces`);
  if (!res.ok) throw new Error('Failed to fetch workspaces');
  return res.json();
}

export async function fetchItems(boardId: string) {
  const res = await fetch(`${API_URL}/items?board_id=${boardId}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function createItem(data: any) {
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function deleteItem(itemId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
}

export async function updateColumnValue(itemId: string, columnId: string, value: any) {
  const res = await fetch(`${API_URL}/items/${itemId}/values`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: columnId, value }),
  });
  if (!res.ok) throw new Error('Failed to update column value');
  return res.json();
}

export async function fetchAutomations(boardId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/automations`);
  if (!res.ok) throw new Error('Failed to fetch automations');
  return res.json();
}

export async function createAutomation(boardId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/automations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create automation');
  return res.json();
}

export async function createColumn(boardId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create column');
  return res.json();
}

export async function deleteColumn(boardId: string, columnId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/columns/${columnId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete column');
  return res.json();
}

export async function reorderColumns(boardId: string, columnIds: string[]) {
  const res = await fetch(`${API_URL}/boards/${boardId}/columns/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder columns');
  return res.json();
}

export async function createGroup(boardId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function updateGroup(boardId: string, groupId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/groups/${groupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update group');
  return res.json();
}

export async function deleteGroup(boardId: string, groupId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/groups/${groupId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete group');
  return res.json();
}
