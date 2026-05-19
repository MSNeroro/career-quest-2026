const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' ? payload.error : payload;
    throw new Error(message || 'API request failed');
  }

  return payload;
}

export const api = {
  startPlayer: (body) =>
    request('/player/start', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  saveProfile: (body) =>
    request('/player/profile', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  saveEvent: (body) =>
    request('/game/event', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  saveScore: (body) =>
    request('/game/score', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getCareers: () => request('/careers'),
  calculateRecommendation: (body) =>
    request('/recommendation/calculate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getRecommendation: (sessionId) => request(`/recommendation/${sessionId}`),
  adminLogin: (body) =>
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  adminDashboard: () => request('/admin/dashboard'),
  createCareer: (body, csrfToken) =>
    request('/admin/careers', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(body),
    }),
  updateCareer: (id, body, csrfToken) =>
    request(`/admin/careers/${id}`, {
      method: 'PUT',
      headers: { 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(body),
    }),
  deleteCareer: (id, csrfToken) =>
    request(`/admin/careers/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    }),
};

export { API_BASE };
