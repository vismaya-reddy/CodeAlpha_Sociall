function renderNavbar(active) {
  const user = Api.getUser();
  const el = document.getElementById('navbar');
  if (!el) return;

  el.innerHTML = `
    <nav class="navbar">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">✨ Sociall</a>
        <div class="nav-search">
          <input type="text" id="navSearchInput" placeholder="Search people...">
          <div class="nav-search-results" id="navSearchResults"></div>
        </div>
        <div class="nav-links">
          <a href="index.html" class="nav-link ${active === 'home' ? 'active' : ''}" title="Home"><span class="nav-emoji">🏠</span><span class="nav-label">Home</span></a>
          <a href="discover.html" class="nav-link ${active === 'discover' ? 'active' : ''}" title="Discover"><span class="nav-emoji">🔍</span><span class="nav-label">Discover</span></a>
          <a href="profile.html" class="nav-link ${active === 'profile' ? 'active' : ''}" title="Profile">${avatarHtml(user, 26)}<span class="nav-label">Profile</span></a>
          <button class="nav-link nav-logout" id="logoutBtn" title="Logout"><span class="nav-emoji">🚪</span><span class="nav-label">Logout</span></button>
        </div>
      </div>
    </nav>`;

  document.getElementById('logoutBtn').addEventListener('click', logout);

  const searchInput = document.getElementById('navSearchInput');
  const resultsBox = document.getElementById('navSearchResults');
  let debounceTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (!q) { resultsBox.classList.remove('show'); resultsBox.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
      try {
        const { users } = await Api.get(`/users/search?q=${encodeURIComponent(q)}`);
        resultsBox.innerHTML = users.length
          ? users.map((u) => `
              <a href="profile.html?username=${u.username}" class="nav-search-item">
                ${avatarHtml(u, 32)}
                <div><div class="nsi-name">${escapeHtml(u.name)}</div><div class="nsi-username">@${escapeHtml(u.username)}</div></div>
              </a>`).join('')
          : `<div class="nav-search-empty">No users found</div>`;
        resultsBox.classList.add('show');
      } catch (err) { /* silent */ }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) resultsBox.classList.remove('show');
  });
}
