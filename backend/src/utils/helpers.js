// Utility functions

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  return new Date(date).toISOString();
};

const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .trim();
};

const paginate = (page, limit, total) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const perPage = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const totalPages = Math.ceil(total / perPage);
  const skip = (currentPage - 1) * perPage;

  return {
    page: currentPage,
    limit: perPage,
    total,
    totalPages,
    skip,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

module.exports = {
  slugify,
  generateRandomString,
  formatDate,
  formatDateTime,
  calculateReadingTime,
  sanitizeInput,
  paginate,
};