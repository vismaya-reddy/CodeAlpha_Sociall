const supabase = require('../config/supabase');

exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, author:users!comments_user_id_fkey(id, name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
    }
    if (content.length > 500) {
      return res.status(400).json({ success: false, message: 'Comment is too long (max 500 characters).' });
    }

    const { data: post, error: e1 } = await supabase.from('posts').select('id').eq('id', postId).single();
    if (e1 || !post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: req.user.id, content: content.trim() }])
      .select('*, author:users!comments_user_id_fkey(id, name, username, avatar_url)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: 'Comment added.', comment });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: comment, error: e1 } = await supabase.from('comments').select('*').eq('id', id).single();
    if (e1 || !comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
    }

    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};
