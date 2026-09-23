requireAuth();
renderNavbar('profile');

const params = new URLSearchParams(window.location.search);
const currentUser = Api.getUser();
const targetUsername = params.get('username') || currentUser.username;

const profileHeader = document.getElementById('profileHeader');
const profilePosts = document.getElementById('profilePosts');
const editModal = document.getElementById('editModal');
const listModal = document.getElementById('listModal');

let profileData = null;
let newAvatarFile = null;

async function loadProfile() {
  profileHeader.innerHTML = `<div class="skeleton skeleton-profile"></div>`;
  try {
    const { user } = await Api.get(`/users/${targetUsername}`);
    profileData = user;
    renderProfileHeader(user);
    loadPosts(user.username);
  } catch (err) {
    profileHeader.innerHTML = `<div class="empty-state"><h3>User not found</h3><p>${escapeHtml(err.message)}</p></div>`;
    profilePosts.innerHTML = '';
  }
}

function renderProfileHeader(user) {
  profileHeader.innerHTML = `
    <div class="profile-card">
      <div class="profile-cover"></div>
      <div class="profile-main">
        ${avatarHtml(user, 100)}
        <div class="profile-info">
          <h2>${escapeHtml(user.name)}</h2>
          <p class="profile-username">@${escapeHtml(user.username)}</p>
          <p class="profile-bio">${user.bio ? escapeHtml(user.bio) : '<span class="muted">No bio yet.</span>'}</p>
        </div>
        <div class="profile-actions">
          ${
            user.isOwnProfile
              ? `<button class="btn btn-secondary" id="editProfileBtn">Edit Profile</button>`
              : `<button class="btn ${user.isFollowing ? 'btn-secondary' : 'btn-primary'}" id="followBtn">${user.isFollowing ? 'Following' : 'Follow'}</button>`
          }
        </div>
      </div>
      <div class="profile-stats">
        <div class="stat-item"><strong>${user.posts}</strong><span>Posts</span></div>
        <div class="stat-item" id="followersStat"><strong>${user.followers}</strong><span>Followers</span></div>
        <div class="stat-item" id="followingStat"><strong>${user.following}</strong><span>Following</span></div>
      </div>
    </div>`;

  if (user.isOwnProfile) {
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
  } else {
    document.getElementById('followBtn').addEventListener('click', toggleFollow);
  }
  document.getElementById('followersStat').addEventListener('click', () => openListModal('followers'));
  document.getElementById('followingStat').addEventListener('click', () => openListModal('following'));
}

async function toggleFollow() {
  const btn = document.getElementById('followBtn');
  btn.disabled = true;
  try {
    const { following, message } = await Api.post(`/users/${profileData.username}/follow`);
    profileData.isFollowing = following;
    profileData.followers += following ? 1 : -1;
    btn.textContent = following ? 'Following' : 'Follow';
    btn.classList.toggle('btn-primary', !following);
    btn.classList.toggle('btn-secondary', following);
    document.querySelector('#followersStat strong').textContent = profileData.followers;
    showToast(message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function openEditModal() {
  document.getElementById('editName').value = profileData.name;
  document.getElementById('editBio').value = profileData.bio || '';
  document.getElementById('editAvatarPreview').innerHTML = avatarHtml(profileData, 80);
  editModal.classList.add('show');
}

document.getElementById('closeEditModal').addEventListener('click', () => editModal.classList.remove('show'));
editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.remove('show'); });

document.getElementById('editAvatarInput').addEventListener('change', (e) => {
  newAvatarFile = e.target.files[0];
  if (!newAvatarFile) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('editAvatarPreview').innerHTML = `<img src="${ev.target.result}" class="avatar" style="width:80px;height:80px">`;
  };
  reader.readAsDataURL(newAvatarFile);
});

document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Saving...`;
  try {
    const fd = new FormData();
    fd.append('name', document.getElementById('editName').value.trim());
    fd.append('bio', document.getElementById('editBio').value.trim());
    if (newAvatarFile) fd.append('avatar', newAvatarFile);
    const { user } = await Api.put('/users/me', fd, true);
    Api.setUser({ ...currentUser, ...user });
    showToast('Profile updated!', 'success');
    editModal.classList.remove('show');
    newAvatarFile = null;
    loadProfile();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
});

async function openListModal(type) {
  document.getElementById('listModalTitle').textContent = type === 'followers' ? 'Followers' : 'Following';
  document.getElementById('listModalBody').innerHTML = `<div class="mini-spinner"></div>`;
  listModal.classList.add('show');
  try {
    const { users } = await Api.get(`/users/${profileData.username}/${type}`);
    document.getElementById('listModalBody').innerHTML = users.length
      ? users.map((u) => `<a href="profile.html?username=${u.username}" class="user-list-item">${avatarHtml(u, 40)}<div><div class="uli-name">${escapeHtml(u.name)}</div><div class="uli-username">@${escapeHtml(u.username)}</div></div></a>`).join('')
      : `<p class="no-comments">Nothing to show yet.</p>`;
  } catch (err) {
    document.getElementById('listModalBody').innerHTML = `<p class="no-comments">Couldn't load list.</p>`;
  }
}
document.getElementById('closeListModal').addEventListener('click', () => listModal.classList.remove('show'));
listModal.addEventListener('click', (e) => { if (e.target === listModal) listModal.classList.remove('show'); });

async function loadPosts(username) {
  profilePosts.innerHTML = `<div class="skeleton skeleton-block"></div>`;
  try {
    const { posts } = await Api.get(`/posts/user/${username}`);
    profilePosts.innerHTML = posts.length
      ? posts.map(renderProfilePost).join('')
      : `<div class="empty-state"><div class="empty-state-emoji">🖋️</div><h3>No posts yet</h3></div>`;
  } catch (err) {
    profilePosts.innerHTML = `<p class="no-comments">Couldn't load posts.</p>`;
  }
}

function renderProfilePost(post) {
  const isOwner = currentUser.id === post.author.id;
  return `<article class="post-card" data-post-id="${post.id}">
    <div class="post-header">
      <div class="post-author">
        ${avatarHtml(post.author, 40)}
        <div><div class="post-author-name">${escapeHtml(post.author.name)}</div><div class="post-author-username">${timeAgo(post.created_at)}</div></div>
      </div>
      ${isOwner ? `<button class="icon-btn post-delete-btn" title="Delete">🗑</button>` : ''}
    </div>
    ${post.content ? `<p class="post-content">${escapeHtml(post.content)}</p>` : ''}
    ${post.image_url ? `<div class="post-image-wrap"><img class="post-image" src="${post.image_url}" loading="lazy"></div>` : ''}
    <div class="post-actions">
      <span class="post-action-btn">${post.likedByMe ? '❤️' : '🤍'} ${post.likeCount}</span>
      <span class="post-action-btn">💬 ${post.commentCount}</span>
    </div>
  </article>`;
}

profilePosts.addEventListener('click', async (e) => {
  if (!e.target.closest('.post-delete-btn')) return;
  const card = e.target.closest('.post-card');
  if (!confirm('Delete this post?')) return;
  try {
    await Api.del(`/posts/${card.dataset.postId}`);
    card.remove();
    showToast('Post deleted.', 'success');
  } catch (err) { showToast(err.message, 'error'); }
});

loadProfile();
