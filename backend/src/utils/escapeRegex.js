/**
 * Escapes special characters for use in a regular expression.
 * @param {string} string 
 * @returns {string}
 */
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = escapeRegex;

