requireAuth();
renderNavbar('discover');

const searchInput = document.getElementById('discoverSearchInput');
const resultsEl = document.getElementById('discoverResults');
let debounceTimer;

function defaultState() {
  return `<div class="empty-state"><div class="empty-state-emoji">🔎</div><h3>Find people</h3><p>Search by name or username to discover new people.</p></div>`;
}

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (!q) { resultsEl.innerHTML = defaultState(); return; }
  debounceTimer = setTimeout(() => search(q), 300);
});

async function search(q) {
  resultsEl.innerHTML = `<div class="mini-spinner"></div>`;
  try {
    const { users } = await Api.get(`/users/search?q=${encodeURIComponent(q)}`);
    resultsEl.innerHTML = users.length
      ? users.map(renderUserCard).join('')
      : `<div class="empty-state"><div class="empty-state-emoji">🙈</div><h3>No matches</h3><p>Try a different name or username.</p></div>`;
  } catch (err) {
    resultsEl.innerHTML = `<p class="no-comments">${escapeHtml(err.message)}</p>`;
  }
}

function renderUserCard(u) {
  return `<div class="user-card" data-username="${u.username}">
    <a href="profile.html?username=${u.username}" class="user-card-link">
      ${avatarHtml(u, 56)}
      <div class="user-card-info">
        <div class="user-card-name">${escapeHtml(u.name)}</div>
        <div class="user-card-username">@${escapeHtml(u.username)}</div>
        ${u.bio ? `<div class="user-card-bio">${escapeHtml(u.bio)}</div>` : ''}
      </div>
    </a>
    <button class="btn ${u.isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm follow-btn">${u.isFollowing ? 'Following' : 'Follow'}</button>
  </div>`;
}

resultsEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.follow-btn');
  if (!btn) return;
  const card = btn.closest('.user-card');
  const username = card.dataset.username;
  btn.disabled = true;
  try {
    const { following, message } = await Api.post(`/users/${username}/follow`);
    btn.textContent = following ? 'Following' : 'Follow';
    btn.classList.toggle('btn-secondary', following);
    btn.classList.toggle('btn-primary', !following);
    showToast(message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

resultsEl.innerHTML = defaultState();
