redirectIfAuthed();

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Logging in...`;
    try {
      const { token, user } = await Api.post('/auth/login', { identifier, password });
      Api.setToken(token);
      Api.setUser(user);
      showToast('Welcome back!', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 400);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const btn = signupForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Creating account...`;
    try {
      const { token, user } = await Api.post('/auth/signup', { name, username, email, password });
      Api.setToken(token);
      Api.setUser(user);
      showToast('Account created! Welcome aboard 🎉', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 400);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}
