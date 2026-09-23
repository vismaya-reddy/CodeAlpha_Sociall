const supabase = require('../config/supabase');

/**
 * Uploads a file buffer to a Supabase Storage bucket and returns its public URL.
 */
async function uploadImage(bucket, buffer, mimetype, folder = '') {
  const ext = (mimetype.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
    contentType: mimetype,
    upsert: false
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { url: data.publicUrl, path: fileName };
}

/** Deletes a file from a bucket, given its storage path. Silently ignores missing paths. */
async function deleteImage(bucket, path) {
  if (!path) return;
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch (err) {
    console.warn('Failed to delete old image:', err.message);
  }
}

/** Extracts the storage object path from a Supabase public URL. */
function extractPath(url, bucket) {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.substring(idx + marker.length);
}

module.exports = { uploadImage, deleteImage, extractPath };
