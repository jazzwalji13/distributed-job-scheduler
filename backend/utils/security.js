const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./config');

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function createSlug(value, suffix = '') {
  const base = slugify(value);
  return suffix ? `${base}-${slugify(suffix)}` : base;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  slugify,
  generateId,
  createSlug
};
