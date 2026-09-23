const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/** Blocks the request unless a valid JWT is provided. Attaches req.user. */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, email, bio, avatar_url')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

/** Attaches req.user if a valid token is present, but never blocks the request. */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user } = await supabase
      .from('users')
      .select('id, name, username, email, bio, avatar_url')
      .eq('id', decoded.id)
      .single();

    if (user) req.user = user;
    next();
  } catch (err) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
