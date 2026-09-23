const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('❌', err.stack || err.message || err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server.'
  });
};

module.exports = errorHandler;
