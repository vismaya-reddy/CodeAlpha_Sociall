requireAuth();
renderNavbar('home');

const currentUser = Api.getUser();
let page = 1;
let loading = false;
let hasMore = true;
let selectedFile = null;

const feedEl = document.getElementById('feed');
const composerAvatar = document.getElementById('composerAvatar');
const postForm = document.getElementById('postForm');
const postContent = document.getElementById('postContent');
const postImageInput = document.getElementById('postImageInput');
const imagePreview = document.getElementById('imagePreview');
const loadMoreBtn = document.getElementById('loadMoreBtn');

composerAvatar.innerHTML = avatarHtml(currentUser, 44);

postImageInput.addEventListener('change', () => {
  const file = postImageInput.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="preview"><button type="button" id="removeImageBtn">✕</button>`;
    imagePreview.classList.add('show');
    document.getElementById('removeImageBtn').addEventListener('click', () => {
      selectedFile = null;
      postImageInput.value = '';
      imagePreview.innerHTML = '';
      imagePreview.classList.remove('show');
    });
  };
  reader.readAsDataURL(file);
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = postContent.value.trim();
  if (!content && !selectedFile) { showToast('Write something or add an image first.', 'error'); return; }

  const submitBtn = postForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span> Posting...`;

  try {
    const fd = new FormData();
    fd.append('content', content);
    if (selectedFile) fd.append('image', selectedFile);
    const { post } = await Api.post('/posts', fd, true);
    feedEl.insertAdjacentHTML('afterbegin', renderPost(post));
    postContent.value = '';
    selectedFile = null;
    postImageInput.value = '';
    imagePreview.innerHTML = '';
    imagePreview.classList.remove('show');
    showToast('Post published!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post';
  }
});

function renderPost(post) {
  const isOwner = currentUser && currentUser.id === post.author.id;
  return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <a href="profile.html?username=${post.author.username}" class="post-author">
          ${avatarHtml(post.author, 44)}
          <div>
            <div class="post-author-name">${escapeHtml(post.author.name)}</div>
            <div class="post-author-username">@${escapeHtml(post.author.username)} · ${timeAgo(post.created_at)}</div>
          </div>
        </a>
        ${isOwner ? `<button class="icon-btn post-delete-btn" title="Delete post">🗑</button>` : ''}
      </div>
      ${post.content ? `<p class="post-content">${escapeHtml(post.content)}</p>` : ''}
      ${post.image_url ? `<div class="post-image-wrap"><img class="post-image" src="${post.image_url}" alt="Post image" loading="lazy"></div>` : ''}
      <div class="post-actions">
        <button class="post-action-btn like-btn ${post.likedByMe ? 'liked' : ''}">
          <span class="like-icon">${post.likedByMe ? '❤️' : '🤍'}</span> <span class="like-count">${post.likeCount}</span>
        </button>
        <button class="post-action-btn comment-toggle-btn">💬 <span class="comment-count">${post.commentCount}</span></button>
      </div>
      <div class="comments-section" hidden>
        <div class="comments-list"></div>
        <form class="comment-form">
          <input type="text" class="comment-input" placeholder="Write a comment..." maxlength="500">
          <button type="submit">Send</button>
        </form>
      </div>
    </article>`;
}

function renderSkeletons(n = 3) {
  return Array(n).fill(`
    <div class="post-card skeleton-card">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton skeleton-line" style="width:60%"></div>
      <div class="skeleton skeleton-line" style="width:90%"></div>
      <div class="skeleton skeleton-block"></div>
    </div>`).join('');
}

function emptyState() {
  return `<div class="empty-state">
    <div class="empty-state-emoji">📭</div>
    <h3>No posts yet</h3>
    <p>Follow people or create your first post to see it here.</p>
  </div>`;
}

async function loadFeed(initial = false) {
  if (loading || !hasMore) return;
  loading = true;
  if (initial) feedEl.innerHTML = renderSkeletons();
  loadMoreBtn.classList.add('loading-state');

  try {
    const { posts, hasMore: more } = await Api.get(`/posts?page=${page}&limit=10`);
    if (initial) feedEl.innerHTML = '';
    if (!posts.length && page === 1) {
      feedEl.innerHTML = emptyState();
    } else {
      feedEl.insertAdjacentHTML('beforeend', posts.map(renderPost).join(''));
    }
    hasMore = more;
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    page++;
  } catch (err) {
    showToast(err.message, 'error');
    if (initial) feedEl.innerHTML = `<div class="empty-state"><p>Couldn't load the feed. Please refresh.</p></div>`;
  } finally {
    loading = false;
    loadMoreBtn.classList.remove('loading-state');
  }
}

feedEl.addEventListener('click', async (e) => {
  const card = e.target.closest('.post-card');
  if (!card) return;
  const postId = card.dataset.postId;

  if (e.target.closest('.like-btn')) {
    const btn = e.target.closest('.like-btn');
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 300);
    try {
      const { liked, likeCount } = await Api.post(`/posts/${postId}/like`);
      btn.classList.toggle('liked', liked);
      btn.querySelector('.like-icon').textContent = liked ? '❤️' : '🤍';
      btn.querySelector('.like-count').textContent = likeCount;
    } catch (err) { showToast(err.message, 'error'); }
  }

  if (e.target.closest('.post-delete-btn')) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await Api.del(`/posts/${postId}`);
      card.classList.add('removing');
      setTimeout(() => card.remove(), 250);
      showToast('Post deleted.', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  if (e.target.closest('.comment-toggle-btn')) {
    const section = card.querySelector('.comments-section');
    const willShow = section.hidden;
    section.hidden = !willShow;
    if (willShow && !section.dataset.loaded) {
      section.dataset.loaded = '1';
      await loadComments(postId, section);
    }
  }

  if (e.target.closest('.comment-delete-btn')) {
    const commentEl = e.target.closest('.comment-item');
    const commentId = commentEl.dataset.commentId;
    try {
      await Api.del(`/comments/${commentId}`);
      commentEl.remove();
      const countEl = card.querySelector('.comment-count');
      countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      showToast('Comment deleted.', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }
});

feedEl.addEventListener('submit', async (e) => {
  if (!e.target.classList.contains('comment-form')) return;
  e.preventDefault();
  const card = e.target.closest('.post-card');
  const postId = card.dataset.postId;
  const input = e.target.querySelector('.comment-input');
  const content = input.value.trim();
  if (!content) return;

  try {
    const { comment } = await Api.post(`/posts/${postId}/comments`, { content });
    const list = card.querySelector('.comments-list');
    list.insertAdjacentHTML('beforeend', renderComment(comment));
    input.value = '';
    const countEl = card.querySelector('.comment-count');
    countEl.textContent = parseInt(countEl.textContent) + 1;
  } catch (err) { showToast(err.message, 'error'); }
});

function renderComment(c) {
  const isOwner = currentUser && currentUser.id === c.author.id;
  return `<div class="comment-item" data-comment-id="${c.id}">
    ${avatarHtml(c.author, 28)}
    <div class="comment-body">
      <span class="comment-author">${escapeHtml(c.author.name)}</span>
      <span class="comment-text">${escapeHtml(c.content)}</span>
      <div class="comment-meta">${timeAgo(c.created_at)} ${isOwner ? `<button class="comment-delete-btn">Delete</button>` : ''}</div>
    </div>
  </div>`;
}

async function loadComments(postId, section) {
  const list = section.querySelector('.comments-list');
  list.innerHTML = `<div class="mini-spinner"></div>`;
  try {
    const { comments } = await Api.get(`/posts/${postId}/comments`);
    list.innerHTML = comments.length ? comments.map(renderComment).join('') : `<p class="no-comments">No comments yet. Be the first!</p>`;
  } catch (err) {
    list.innerHTML = `<p class="no-comments">Couldn't load comments.</p>`;
  }
}

loadMoreBtn.addEventListener('click', () => loadFeed());
loadFeed(true);
