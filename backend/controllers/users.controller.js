const supabase = require('../config/supabase');
const { uploadImage, deleteImage, extractPath } = require('../utils/storage');

const AVATAR_BUCKET = 'avatars';

const getCounts = async (userId) => {
  const [followersRes, followingRes, postsRes] = await Promise.all([
    supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  ]);
  return {
    followers: followersRes.count || 0,
    following: followingRes.count || 0,
    posts: postsRes.count || 0
  };
};

exports.getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, email, bio, avatar_url, created_at')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const counts = await getCounts(user.id);

    let isFollowing = false;
    if (req.user && req.user.id !== user.id) {
      const { data: followRow } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', req.user.id)
        .eq('following_id', user.id)
        .maybeSingle();
      isFollowing = !!followRow;
    }

    res.json({
      success: true,
      user: { ...user, ...counts, isFollowing, isOwnProfile: req.user ? req.user.id === user.id : false }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      updates.name = name.trim();
    }
    if (bio !== undefined) updates.bio = bio.trim().slice(0, 250);

    if (req.file) {
      const { data: current } = await supabase.from('users').select('avatar_url').eq('id', req.user.id).single();
      const { url } = await uploadImage(AVATAR_BUCKET, req.file.buffer, req.file.mimetype, req.user.id);
      updates.avatar_url = url;
      if (current && current.avatar_url) {
        await deleteImage(AVATAR_BUCKET, extractPath(current.avatar_url, AVATAR_BUCKET));
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, username, email, bio, avatar_url')
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Profile updated successfully!', user: updated });
  } catch (err) {
    next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, users: [] });

    const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    const [{ data: byName, error: nameError }, { data: byUsername, error: usernameError }] = await Promise.all([
      supabase.from('users').select('id, name, username, bio, avatar_url').ilike('name', pattern).limit(20),
      supabase.from('users').select('id, name, username, bio, avatar_url').ilike('username', pattern).limit(20)
    ]);

    if (nameError) throw nameError;
    if (usernameError) throw usernameError;

    const merged = new Map();
    [...(byName || []), ...(byUsername || [])].forEach((u) => merged.set(u.id, u));
    let users = [...merged.values()]
      .filter((u) => !req.user || u.id !== req.user.id)
      .slice(0, 20);

    if (req.user && users.length) {
      const ids = users.map((u) => u.id);
      const { data: follows, error: followError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', req.user.id)
        .in('following_id', ids);
      if (followError) throw followError;
      const followingSet = new Set((follows || []).map((f) => f.following_id));
      users = users.map((u) => ({ ...u, isFollowing: followingSet.has(u.id) }));
    } else {
      users = users.map((u) => ({ ...u, isFollowing: false }));
    }

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};
