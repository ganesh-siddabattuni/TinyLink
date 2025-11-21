const API_BASE = 'http://localhost:5000';

// 1. Get all links
export const getLinks = async () => {
  const res = await fetch(`${API_BASE}/api/links`);
  return res.json();
};

// 2. Create a new link
export const createLink = async (url, shortCode) => {
  const res = await fetch(`${API_BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, shortCode }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create link');
  }
  return res.json();
};

// 3. Delete a link
export const deleteLink = async (code) => {
  await fetch(`${API_BASE}/api/links/${code}`, {
    method: 'DELETE',
  });
};

// 4. Get stats for one link
export const getLinkStats = async (code) => {
    const res = await fetch(`${API_BASE}/api/links/${code}`);
    return res.json();
};