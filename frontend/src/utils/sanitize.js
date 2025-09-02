// Sanitization utility to prevent XSS attacks
export const sanitizeText = (text) => {
  if (!text) return '';
  return String(text).replace(/[<>"'&]/g, (match) => {
    const escapeMap = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return escapeMap[match];
  });
};

export const sanitizeFilename = (filename) => {
  if (!filename) return 'download';
  return String(filename)
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .replace(/[^\w\-_.]/g, '_') // Replace non-alphanumeric with underscore
    .substring(0, 100); // Limit length
};