const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { isValidEmail, isValidUsername } = require('../utils/validators');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sanitizeUser = (user) => {
  const { password_hash, ...safe } = user;
  return safe;
};

exports.signup = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const username = String(req.body.username || '').trim().toLowerCase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, username, email and password are all required.' });
    }
    if (name.length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be 100 characters or fewer.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!isValidUsername(username)) {
      return res.status(400).json({ success: false, message: 'Username must be 3-20 characters: letters, numbers, underscores only.' });
    }
    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ success: false, message: 'Password must be 6-72 characters long.' });
    }

    const { data: emailMatch, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (emailError) throw emailError;
    if (emailMatch) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const { data: usernameMatch, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (usernameError) throw usernameError;
    if (usernameMatch) {
      return res.status(409).json({ success: false, message: 'Username is already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ name, username, email, password_hash, bio: '' }])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(newUser.id);
    res.status(201).json({ success: true, message: 'Account created successfully!', token, user: sanitizeUser(newUser) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required.' });
    }

    let user = null;
    const { data: emailUser, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', identifier)
      .maybeSingle();
    if (emailError) throw emailError;
    user = emailUser;

    if (!user) {
      const { data: usernameUser, error: usernameError } = await supabase
        .from('users')
        .select('*')
        .eq('username', identifier)
        .maybeSingle();
      if (usernameError) throw usernameError;
      user = usernameUser;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user.id);
    res.json({ success: true, message: 'Logged in successfully!', token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};
