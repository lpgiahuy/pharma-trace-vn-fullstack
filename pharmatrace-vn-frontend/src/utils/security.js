import DOMPurify from 'dompurify'

/**
 * Safely sanitizes HTML content to prevent XSS attacks.
 * Use this whenever rendering content via dangerouslySetInnerHTML.
 * 
 * @param {string} html - The raw HTML string to sanitize.
 * @returns {string} - The sanitized HTML string.
 */
export const sanitizeHtml = (html) => {
  if (!html) return ''
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'style', 'id']
  })
}
