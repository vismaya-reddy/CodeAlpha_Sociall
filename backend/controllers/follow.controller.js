const supabase = require('../config/supabase');

exports.toggleFollow = async (req, res, next) => {
  try {
    const { username } = req.params;

    const { data: target, error: targetErr } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username.toLowerCase())
      .single();

    if (targetErr || !target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (target.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't follow yourself." });
    }

    const { data: existing } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', req.user.id)
      .eq('following_id', target.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('followers').delete().eq('id', existing.id);
      if (error) throw error;
      return res.json({ success: true, message: `Unfollowed @${target.username}`, following: false });
    } else {
      const { error } = await supabase
        .from('followers')
        .insert([{ follower_id: req.user.id, following_id: target.id }]);
      if (error) throw error;
      return res.json({ success: true, message: `Now following @${target.username}`, following: true });
    }
  } catch (err) {
    next(err);
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { data: target, error: e1 } = await supabase
      .from('users').select('id').eq('username', username.toLowerCase()).single();
    if (e1 || !target) return res.status(404).json({ success: false, message: 'User not found.' });

    const { data, error } = await supabase
      .from('followers')
      .select('follower:users!followers_follower_id_fkey(id, name, username, avatar_url, bio)')
      .eq('following_id', target.id);

    if (error) throw error;
    res.json({ success: true, users: data.map((d) => d.follower) });
  } catch (err) {
    next(err);
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { data: target, error: e1 } = await supabase
      .from('users').select('id').eq('username', username.toLowerCase()).single();
    if (e1 || !target) return res.status(404).json({ success: false, message: 'User not found.' });

    const { data, error } = await supabase
      .from('followers')
      .select('following:users!followers_following_id_fkey(id, name, username, avatar_url, bio)')
      .eq('follower_id', target.id);

    if (error) throw error;
    res.json({ success: true, users: data.map((d) => d.following) });
  } catch (err) {
    next(err);
  }
};
