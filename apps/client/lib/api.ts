const API_URL = 'http://localhost:3002';

// Boards
export async function fetchBoards() {
  const res = await fetch(`${API_URL}/boards`);
  return res.json();
}

// Workspaces
export async function fetchWorkspaces() {
  const res = await fetch(`${API_URL}/workspaces`);
  return res.json();
}

export async function createWorkspace(data: any) {
  const res = await fetch(`${API_URL}/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createBoard(data: any) {
  const res = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchBoard(id: string) {
  const res = await fetch(`${API_URL}/boards/${id}`);
  return res.json();
}

// Groups
export async function createGroup(boardId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateGroup(boardId: string, groupId: string, title: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/groups/${groupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: title }),
  });
  return res.json();
}

export async function deleteGroup(boardId: string, groupId: string) {
  await fetch(`${API_URL}/boards/${boardId}/groups/${groupId}`, {
    method: 'DELETE',
  });
}

// Columns
export async function createColumn(boardId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteColumn(boardId: string, columnId: string) {
  await fetch(`${API_URL}/boards/${boardId}/columns/${columnId}`, {
    method: 'DELETE',
  });
}

export async function reorderColumns(boardId: string, columnIds: string[]) {
  await fetch(`${API_URL}/boards/${boardId}/columns/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnIds }),
  });
}

// Items
export async function fetchItems(boardId: string) {
  const res = await fetch(`${API_URL}/items?board_id=${boardId}`);
  return res.json();
}

export async function createItem(data: any) {
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateColumnValue(itemId: string, columnId: string, value: any) {
  const res = await fetch(`${API_URL}/items/${itemId}/values`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: columnId, value }),
  });
  return res.json();
}

export async function deleteItem(itemId: string) {
  await fetch(`${API_URL}/items/${itemId}`, {
    method: 'DELETE',
  });
}

// Activity Logs
export async function fetchItemActivityLogs(boardId: string, itemId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/activity-logs/items/${itemId}`);
  return res.json();
}
export const getItemLogs = fetchItemActivityLogs;

export async function fetchActivityLogs(boardId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/activity-logs`);
  return res.json();
}

// Auth
export async function login(data: any) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function register(data: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Register failed');
  return res.json();
}

// Dashboards
export async function fetchDashboardStats() {
  const res = await fetch(`${API_URL}/dashboards/stats`);
  return res.json();
}

// Notifications
export async function fetchNotifications(userId: string) {
  const res = await fetch(`${API_URL}/notifications?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function fetchUnreadCount(userId: string) {
  const res = await fetch(`${API_URL}/notifications/unread-count?userId=${userId}`);
  if (!res.ok) return { count: 0 };
  return res.json();
}

export async function markNotificationAsRead(id: string) {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

export async function markAllNotificationsAsRead(userId: string) {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to mark all as read');
  return res.json();
}

// Automations
export async function fetchAutomations(boardId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}/automations`);
  return res.json();
}

export async function createAutomation(boardId: string, data: any) {
  const res = await fetch(`${API_URL}/boards/${boardId}/automations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Updates (Comments)
export async function fetchUpdates(itemId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}/updates`);
  return res.json();
}

export async function createUpdate(itemId: string, content: string, userId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}/updates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, user_id: userId }),
  });
  return res.json();
}

// Time tracking
export async function fetchTimeLogs(itemId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}/time-logs`);
  return res.json();
}

export async function startTimer(itemId: string, userId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}/time-logs/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

export async function stopTimer(itemId: string, userId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}/time-logs/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

// Files
export async function fetchFiles(itemId: string) {
  const res = await fetch(`${API_URL}/items/${itemId}/files`);
  return res.json();
}

export async function createFile(itemId: string, data: any) {
  const res = await fetch(`${API_URL}/items/${itemId}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteFile(fileId: string) {
  await fetch(`${API_URL}/files/${fileId}`, {
    method: 'DELETE',
  });
}
