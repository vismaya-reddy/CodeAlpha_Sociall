const supabase = require('../config/supabase');
const { uploadImage, deleteImage, extractPath } = require('../utils/storage');

const POST_BUCKET = 'post-images';

const attachMeta = async (posts, currentUserId) => {
  if (!posts.length) return posts;
  const postIds = posts.map((p) => p.id);

  const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
    supabase.from('likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds)
  ]);

  let myLikes = [];
  if (currentUserId) {
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds);
    myLikes = data || [];
  }

  const likeMap = {}, commentMap = {};
  const likedSet = new Set(myLikes.map((l) => l.post_id));
  (likeRows || []).forEach((l) => (likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1));
  (commentRows || []).forEach((c) => (commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1));

  return posts.map((p) => ({
    ...p,
    likeCount: likeMap[p.id] || 0,
    commentCount: commentMap[p.id] || 0,
    likedByMe: likedSet.has(p.id)
  }));
};

exports.getFeed = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_user_id_fkey(id, name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const enriched = await attachMeta(posts, req.user?.id);
    res.json({ success: true, posts: enriched, page, hasMore: posts.length === limit });
  } catch (err) {
    next(err);
  }
};

exports.getUserPosts = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { data: target, error: e1 } = await supabase
      .from('users').select('id').eq('username', username.toLowerCase()).single();
    if (e1 || !target) return res.status(404).json({ success: false, message: 'User not found.' });

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_user_id_fkey(id, name, username, avatar_url)')
      .eq('user_id', target.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await attachMeta(posts, req.user?.id);
    res.json({ success: true, posts: enriched });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { content } = req.body;

    if ((!content || !content.trim()) && !req.file) {
      return res.status(400).json({ success: false, message: 'Post must have text or an image.' });
    }
    if (content && content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Post content is too long (max 2000 characters).' });
    }

    let image_url = null;
    if (req.file) {
      const { url } = await uploadImage(POST_BUCKET, req.file.buffer, req.file.mimetype, req.user.id);
      image_url = url;
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert([{ user_id: req.user.id, content: content ? content.trim() : '', image_url }])
      .select('*, author:users!posts_user_id_fkey(id, name, username, avatar_url)')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Post published!',
      post: { ...post, likeCount: 0, commentCount: 0, likedByMe: false }
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: post, error: e1 } = await supabase.from('posts').select('*').eq('id', id).single();
    if (e1 || !post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts.' });
    }

    if (post.image_url) {
      await deleteImage(POST_BUCKET, extractPath(post.image_url, POST_BUCKET));
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { data: post, error: e1 } = await supabase.from('posts').select('id').eq('id', postId).single();
    if (e1 || !post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const { data: existing } = await supabase
      .from('likes').select('id').eq('post_id', postId).eq('user_id', req.user.id).maybeSingle();

    if (existing) {
      const { error } = await supabase.from('likes').delete().eq('id', existing.id);
      if (error) throw error;
      const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
      return res.json({ success: true, liked: false, likeCount: count || 0 });
    } else {
      const { error } = await supabase.from('likes').insert([{ post_id: postId, user_id: req.user.id }]);
      if (error) throw error;
      const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
      return res.json({ success: true, liked: true, likeCount: count || 0 });
    }
  } catch (err) {
    next(err);
  }
};
