exports.isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.isValidUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);
