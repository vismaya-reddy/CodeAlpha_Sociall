const Api = {
  getToken() { return localStorage.getItem('sm_token'); },
  setToken(token) { localStorage.setItem('sm_token', token); },
  clearToken() { localStorage.removeItem('sm_token'); },
  getUser() { const u = localStorage.getItem('sm_user'); return u ? JSON.parse(u) : null; },
  setUser(user) { localStorage.setItem('sm_user', JSON.stringify(user)); },

  async request(endpoint, { method = 'GET', body = null, isForm = false } = {}) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isForm && body) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
    return data;
  },

  get(endpoint) { return this.request(endpoint); },
  post(endpoint, body, isForm = false) { return this.request(endpoint, { method: 'POST', body, isForm }); },
  put(endpoint, body, isForm = false) { return this.request(endpoint, { method: 'PUT', body, isForm }); },
  del(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

function requireAuth() {
  if (!Api.getToken()) window.location.href = 'login.html';
}

function redirectIfAuthed() {
  if (Api.getToken()) window.location.href = 'index.html';
}

function logout() {
  Api.clearToken();
  localStorage.removeItem('sm_user');
  window.location.href = 'login.html';
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  const intervals = [['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60]];
  for (const [label, secs] of intervals) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val}${label} ago`;
  }
  return 'just now';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function avatarHtml(user, size = 40) {
  if (user && user.avatar_url) {
    return `<img class="avatar" style="width:${size}px;height:${size}px" src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.name || '')}">`;
  }
  return `<div class="avatar avatar-fallback" style="width:${size}px;height:${size}px">${initials(user ? user.name : '?')}</div>`;
}
